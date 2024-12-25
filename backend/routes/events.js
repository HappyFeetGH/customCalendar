const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// 이벤트 저장 API
router.post('/', (req, res) => {
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

        if (results.length > 0) {
            saveEvent(results[0].id);
        } else {
            // 태그가 없으면 새로 생성
            const insertTagQuery = `INSERT INTO Tags (name) VALUES (?)`;
            connection.query(insertTagQuery, [tag], (err, result) => {
                if (err) {
                    console.error('태그 생성 실패:', err);
                    return res.status(500).json({ success: false, message: '태그 생성 실패' });
                } 
                saveEvent(result.insertId);
            });
        }
    });

    // 이벤트 저장 로직
    function saveEvent(tagId) {
        const insertEventQuery = `
            INSERT INTO Events (title, description, start_datetime, end_datetime, tag_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        let currentDate = new Date(start);
        let currentEndDate = new Date(end);

        const promises = []; // 모든 반복 저장 작업을 Promise로 관리

        for (let i = 0; i < repeatCount; i++) {
            const eventStart = new Date(currentDate);
            const eventEnd = new Date(currentEndDate);

            const promise = new Promise((resolve, reject) => {
                connection.query(insertEventQuery, [title, description, eventStart, eventEnd, tagId, 1], (err, result) => {
                    if (err) {
                        console.error('이벤트 저장 실패:', err);
                        reject(err);
                    } else {
                        console.log(`Event 저장 성공 - 반복 ${i + 1}:`, result.insertId);
                        resolve(result.insertId);
                    }
                });
            });

            promises.push(promise);

            // 다음 반복 날짜 계산
            if (repeat === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1);
                currentEndDate.setDate(currentEndDate.getDate() + 1);
            } else if (repeat === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
                currentEndDate.setDate(currentEndDate.getDate() + 7);
            } else if (repeat === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentEndDate.setMonth(currentEndDate.getMonth() + 1);
            }
        }

        // 모든 저장이 완료되면 응답
        Promise.all(promises)
            .then(() => res.json({ success: true }))
            .catch((err) => {
                console.error('반복 저장 중 오류 발생:', err);
                res.status(500).json({ success: false, message: '반복 저장 중 오류 발생' });
            });
    }
    
});

// 이벤트 로드 API
router.get('/', (req, res) => {
    const query = `
        SELECT e.id, e.title, e.description, e.start_datetime AS start, e.end_datetime AS end, t.name AS tag
        FROM Events e
        LEFT JOIN Tags t ON e.tag_id = t.id
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('이벤트 로드 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 로드 실패' });
        }
        res.json(results);
    });
});

// 이벤트 수정 API
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, start, end, tag } = req.body;

    console.log('PUT 요청 수신:', req.params.id, req.body);

    const updateQuery = `
        UPDATE Events 
        SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, tag_id = ?
        WHERE id = ?
    `;

    connection.query(updateQuery, [title, description, start, end, tag, id], (err) => {
        if (err) {
            console.error('이벤트 수정 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 수정 실패' });
        }
        res.json({ success: true });
    });
});

// 이벤트 삭제 API
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const deleteQuery = `DELETE FROM Events WHERE id = ?`;

    connection.query(deleteQuery, [id], (err) => {
        if (err) {
            console.error('이벤트 삭제 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 삭제 실패' });
        }
        res.json({ success: true });
    });
});


router.get('/:id', (req, res) => {
    const { id } = req.params;
    const selectQuery = `SELECT * FROM Events WHERE id = ?`;

    connection.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('이벤트 조회 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 조회 실패' });
        }

        if (results.length === 0) {
            console.log('이벤트를 찾을 수 없습니다:', id);
            return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
        }

        //console.log('이벤트 데이터:', results[0]);
        res.json(results[0]);
    });
});



function getPeriodFromTime(time) {
    const periods = [
        { start: "09:00", end: "09:50", period: 1 },
        { start: "09:50", end: "10:40", period: 2 },
        { start: "10:40", end: "11:30", period: 3 },
        { start: "11:30", end: "12:10", period: 4 },
        { start: "13:00", end: "13:50", period: 5 },
        { start: "13:50", end: "14:40", period: 6 },
        { start: "14:40", end: "15:20", period: 7 },
    ];

    const [hour, minute] = time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;

    for (const p of periods) {
        const [startHour, startMinute] = p.start.split(':').map(Number);
        const [endHour, endMinute] = p.end.split(':').map(Number);

        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;

        if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
            return p.period;
        }
    }

    return 8; // 교시를 찾을 수 없는 경우
}




module.exports = router;


