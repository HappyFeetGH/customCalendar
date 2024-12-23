const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// 이벤트 저장 API
router.post('/events', (req, res) => {
    const { title, description, start, end, tag, repeat, repeatCount } = req.body;

    // 기본 이벤트 저장
    const insertEvent = `
        INSERT INTO Events (title, description, start_datetime, end_datetime, tag_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(insertEvent, [title, description, start, end, tag, 1], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'DB 저장 실패' });
        }

        const eventId = result.insertId;

        // 반복 이벤트 저장
        if (repeat !== 'none') {
            const insertPeriods = `
                INSERT INTO Periods (event_id, period)
                VALUES (?, ?)
            `;
            const periods = [];
            const startDate = new Date(start);
            for (let i = 0; i < repeatCount; i++) {
                if (repeat === 'daily') {
                    startDate.setDate(startDate.getDate() + 1);
                } else if (repeat === 'weekly') {
                    startDate.setDate(startDate.getDate() + 7);
                } else if (repeat === 'monthly') {
                    startDate.setMonth(startDate.getMonth() + 1);
                }
                periods.push([eventId, startDate.toISOString()]);
            }

            connection.query(insertPeriods, [periods], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: '반복 저장 실패' });
                }
                res.json({ success: true });
            });
        } else {
            res.json({ success: true });
        }
    });
});

module.exports = router;
