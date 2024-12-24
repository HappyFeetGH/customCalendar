const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// 이벤트 저장 API
router.post('/', (req, res) => {
    console.log('Received request:', req.body);
    const { title, description, start, end, tag, repeat, repeatCount } = req.body;

    if (!title || !start || !end) {
        return res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' });
    }

    // 태그 확인 또는 생성
    const checkTagQuery = `SELECT id FROM Tags WHERE name = ?`;
    connection.query(checkTagQuery, [tag], (err, results) => {
        if (err) {
            console.error('태그 조회 실패:', err);
            return res.status(500).json({ success: false, message: '태그 확인 실패' });
        }

        let tagId;

        if (results.length > 0) {
            // 태그가 이미 존재하면 ID 사용
            tagId = results[0].id;
            saveEvent(tagId);
        } else {
            // 태그가 없으면 새로 생성
            const insertTagQuery = `INSERT INTO Tags (name) VALUES (?)`;
            connection.query(insertTagQuery, [tag], (err, result) => {
                if (err) {
                    console.error('태그 생성 실패:', err);
                    return res.status(500).json({ success: false, message: '태그 생성 실패' });
                }
                tagId = result.insertId;
                saveEvent(tagId);
            });
        }
    });

    // 이벤트 저장 로직
    function saveEvent(tagId) {
        const insertEventQuery = `
            INSERT INTO Events (title, description, start_datetime, end_datetime, tag_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        connection.query(insertEventQuery, [title, description, start, end, tagId, 1], (err, result) => {
            if (err) {
                console.error('이벤트 저장 실패:', err);
                return res.status(500).json({ success: false, message: '이벤트 저장 실패' });
            }

            const eventId = result.insertId;
            console.log('Event 저장 성공:', eventId);

            // 반복 이벤트 저장
            if (repeat !== 'none') {
                const insertPeriodsQuery = `
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

                connection.query(insertPeriodsQuery, [periods], (err) => {
                    if (err) {
                        console.error('반복 저장 실패:', err);
                        return res.status(500).json({ success: false, message: '반복 저장 실패' });
                    }
                    res.json({ success: true });
                });
            } else {
                res.json({ success: true });
            }
        });
    }
});


module.exports = router;


