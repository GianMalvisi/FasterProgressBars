const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// DB Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hci_experiment'
};

app.post('/api/save', async (req, res) => {
    const { participantInfo, trialsData } = req.body;

    if (!participantInfo || !trialsData || !Array.isArray(trialsData)) {
        return res.status(400).json({ error: 'Invalid payload structure' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Begin transaction ensures atomic inserts across both tables
        await connection.beginTransaction();

        const [participantResult] = await connection.execute(
            'INSERT INTO participants (first_name, last_name, age, gender) VALUES (?, ?, ?, ?)',
            [participantInfo.firstName, participantInfo.lastName, participantInfo.age, participantInfo.gender]
        );

        const participantId = participantResult.insertId;

        const trialValues = trialsData.map(t => [
            participantId,
            t.trialNumber,
            t.durationMs,
            t.barA,
            t.barB,
            t.choice
        ]);

        await connection.query(
            'INSERT INTO trials (participant_id, trial_number, duration_ms, bar_a, bar_b, choice) VALUES ?',
            [trialValues]
        );

        await connection.commit();
        res.json({ success: true, participantId: participantId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Transaction error:', error);
        res.status(500).json({ error: 'Database transaction failed' });
    } finally {
        if (connection) await connection.end();
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});