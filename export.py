import os
import pymysql
import pandas as pd
from scipy.stats import binomtest

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "admin",  # Set MariaDB root password if configured
    "database": "hci_experiment",
    "cursorclass": pymysql.cursors.DictCursor
}

CANONICAL_PAIRS = [
    ("ribbed", "solid"),
    ("pulsating", "solid"),
    ("ribbed", "pulsating")
]


def fetch_data() -> pd.DataFrame:
    """Fetch trial records joined with participant metadata from MariaDB."""
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    t.id AS trial_id,
                    t.participant_id,
                    p.first_name,
                    p.last_name,
                    p.age,
                    p.gender,
                    t.trial_number,
                    t.duration_ms,
                    t.bar_a,
                    t.bar_b,
                    t.choice
                FROM trials t
                JOIN participants p ON t.participant_id = p.id
                ORDER BY t.participant_id, t.trial_number;
            """
            cursor.execute(query)
            rows = cursor.fetchall()
    finally:
        conn.close()
    return pd.DataFrame(rows)


def normalize_trial(row: pd.Series) -> pd.Series:
    """Map A/B presentation order to canonical pairs and assign preference scores (+1, -1, 0)."""
    bar_a, bar_b, choice = row["bar_a"], row["bar_b"], row["choice"]

    if choice == "equal":
        faster = "equal"
    elif choice == "A":
        faster = bar_a
    else:
        faster = bar_b

    if bar_a == bar_b:
        return pd.Series(
            [f"{bar_a}_vs_{bar_b}_control", faster, 0],
            index=["canonical_pair", "perceived_faster", "preference_score"]
        )

    for b1, b2 in CANONICAL_PAIRS:
        if {bar_a, bar_b} == {b1, b2}:
            pair_name = f"{b1}_vs_{b2}"
            score = 1 if faster == b1 else (-1 if faster == b2 else 0)
            return pd.Series(
                [pair_name, faster, score],
                index=["canonical_pair", "perceived_faster", "preference_score"]
            )

    return pd.Series(
        ["unknown", faster, 0],
        index=["canonical_pair", "perceived_faster", "preference_score"]
    )


def compute_study3_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Compute mean preference scores and two-sided sign test p-values per duration."""
    durations = [
        (5000, "5s (5000 ms)"),
        (15000, "15s (15000 ms)"),
        (None, "Combined (5s + 15s)")
    ]
    summary_rows = []

    for dur_ms, dur_label in durations:
        subset = df if dur_ms is None else df[df["duration_ms"] == dur_ms]

        for b1, b2 in CANONICAL_PAIRS:
            pair_name = f"{b1}_vs_{b2}"
            pair_df = subset[subset["canonical_pair"] == pair_name]

            b1_wins = int((pair_df["perceived_faster"] == b1).sum())
            b2_wins = int((pair_df["perceived_faster"] == b2).sum())
            ties = int((pair_df["perceived_faster"] == "equal").sum())
            total = len(pair_df)

            pref_score = (b1_wins - b2_wins) / total if total > 0 else 0.0
            non_tied = b1_wins + b2_wins
            p_val = (
                binomtest(b1_wins, non_tied, p=0.5, alternative="two-sided").pvalue
                if non_tied > 0 else 1.0
            )

            if p_val < 0.001:
                sig = "*** (p < 0.001)"
            elif p_val < 0.01:
                sig = "** (p < 0.01)"
            elif p_val < 0.05:
                sig = "* (p < 0.05)"
            elif p_val < 0.10:
                sig = ". (p < 0.10)"
            else:
                sig = "ns"

            summary_rows.append({
                "Duration": dur_label,
                "Comparison (Bar 1 vs Bar 2)": f"{b1.capitalize()} vs {b2.capitalize()}",
                "Bar 1 Wins": b1_wins,
                "Bar 2 Wins": b2_wins,
                "Equal (Ties)": ties,
                "Total Trials (N)": total,
                "Mean Preference Score": round(pref_score, 3),
                "Sign Test p-value": round(p_val, 4),
                "Significance": sig
            })

    return pd.DataFrame(summary_rows)


def compute_per_participant(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate mean preference scores per participant and duration."""
    rows = []
    group_cols = ["participant_id", "first_name", "last_name", "age", "gender"]

    for (pid, fname, lname, age, gender), p_df in df.groupby(group_cols):
        for dur in [5000, 15000]:
            d_df = p_df[p_df["duration_ms"] == dur]
            row_data = {
                "participant_id": pid,
                "participant": f"{fname} {lname}",
                "age": age,
                "gender": gender,
                "duration_s": dur // 1000
            }
            for b1, b2 in CANONICAL_PAIRS:
                pair_name = f"{b1}_vs_{b2}"
                sub = d_df[d_df["canonical_pair"] == pair_name]
                row_data[f"pref_{pair_name}"] = (
                    round(float(sub["preference_score"].mean()), 3) if len(sub) > 0 else 0.0
                )
            rows.append(row_data)

    return pd.DataFrame(rows)


def main() -> None:
    os.makedirs("exports", exist_ok=True)

    df_raw = fetch_data()
    df_raw[["canonical_pair", "perceived_faster", "preference_score"]] = df_raw.apply(
        normalize_trial, axis=1
    )

    df_summary = compute_study3_metrics(df_raw)
    df_participants = compute_per_participant(df_raw)

    csv_path = os.path.join("exports", "hci_experiment_raw_trials.csv")
    xlsx_path = os.path.join("exports", "hci_experiment_study3_analysis.xlsx")

    df_raw.to_csv(csv_path, index=False)
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df_summary.to_excel(writer, sheet_name="Study3_Summary", index=False)
        df_participants.to_excel(writer, sheet_name="Per_Participant", index=False)
        df_raw.to_excel(writer, sheet_name="Raw_Normalized", index=False)

    print(f"Exported: {csv_path}")
    print(f"Exported: {xlsx_path}\n")
    print(df_summary.to_string(index=False))


if __name__ == "__main__":
    main()