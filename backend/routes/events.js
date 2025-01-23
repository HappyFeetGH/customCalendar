const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');

// 이벤트 저장 API
router.post('/', (req, res) => {
    const { title, description, start, end, tags, repeat, repeatCount } = req.body;
    
    if (!title || !start || !end) {
        return res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' });
    }

    // 태그 확인 또는 생성
    const tagPromises = tags.map(tagName => {
        return new Promise((resolve, reject) => {
            if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') {
                return reject(new Error('유효하지 않은 태그 이름'));
            }

            const checkTagQuery = `SELECT id FROM Tags WHERE name = ?`;
            pool.query(checkTagQuery, [tagName.trim()], (err, results) => {
                if (err) return reject(err);

                if (results.length > 0) {
                    resolve(results[0].id); // 기존 태그 ID 반환
                } else {
                    const insertTagQuery = `INSERT INTO Tags (name, color) VALUES (?, ?)`;
                    pool.query(insertTagQuery, [tagName.trim(), '#FFFFFF'], (err, result) => {
                        if (err) return reject(err);
                        resolve(result.insertId); // 새로 생성된 태그 ID 반환
                    });
                }
            });
        });
    });

    // 모든 태그 처리 완료 후 이벤트 저장
    Promise.all(tagPromises)
        .then(tagIds => saveEvent(tagIds)) // 태그 ID 배열을 전달
        .catch(err => {
            console.error('태그 처리 실패:', err);
            res.status(500).json({ success: false, message: '태그 처리 실패' });
        });

    // 이벤트 저장 로직
    function saveEvent(tagIds) {
        const insertEventQuery = `
            INSERT INTO Events (title, description, start_datetime, end_datetime, created_by)
            VALUES (?, ?, ?, ?, ?)
        `;

        let currentDate = new Date(new Date(start).getTime() + 9 * 60 * 60 * 1000);
        let currentEndDate = new Date(new Date(end).getTime() + 9 * 60 * 60 * 1000);

        const promises = [];

        for (let i = 0; i < repeatCount; i++) {
            const eventStart = new Date(currentDate);
            const eventEnd = new Date(currentEndDate);

            const promise = new Promise((resolve, reject) => {
                pool.query(insertEventQuery, [title, description, eventStart, eventEnd, 1], (err, result) => {
                    if (err) {
                        console.error('이벤트 저장 실패:', err);
                        return reject(err);
                    }

                    const eventId = result.insertId;

                    // EventTags 테이블에 태그 저장
                    const insertEventTagsQuery = `INSERT INTO EventTags (event_id, tag_id) VALUES ?`;
                    const eventTagsData = tagIds.map(tagId => [eventId, tagId]);

                    pool.query(insertEventTagsQuery, [eventTagsData], (err) => {
                        if (err) {
                            console.error('EventTags 저장 실패:', err);
                            return reject(err);
                        }
                        resolve(eventId);
                    });
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
            .catch(err => {
                console.error('반복 저장 중 오류 발생:', err);
                res.status(500).json({ success: false, message: '반복 저장 중 오류 발생' });
            });
    }
});


// 이벤트 로드 API
router.get('/', (req, res) => {
    const query = `
        SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime, e.created_by, 
            JSON_ARRAYAGG(t.name) AS tags,
            (SELECT t.color 
                FROM Tags t
                INNER JOIN EventTags et ON t.id = et.tag_id
                WHERE et.event_id = e.id
                ORDER BY t.id ASC
                LIMIT 1) AS primary_color
        FROM Events e
        LEFT JOIN EventTags et ON e.id = et.event_id
        LEFT JOIN Tags t ON et.tag_id = t.id
        GROUP BY e.id
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error('이벤트 데이터 로드 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 데이터 로드 실패' });
        }
        res.json(results);
    });
});


router.put('/:id(\\d+)', (req, res) => {
    const { id } = req.params;
    const { title, description, start, end, tags } = req.body; // 태그 목록

    // 1. 이벤트 기본 정보 업데이트
    const updateEventQuery = `
        UPDATE Events 
        SET title = ?, description = ?, start_datetime = ?, end_datetime = ?
        WHERE id = ?
    `;

    let currentDate = new Date(new Date(start).getTime() + 9 * 60 * 60 * 1000);
    let currentEndDate = new Date(new Date(end).getTime() + 9 * 60 * 60 * 1000);

    pool.query(updateEventQuery, [title, description, currentDate, currentEndDate, id], (err) => {
        if (err) {
            console.error('이벤트 수정 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 수정 실패' });
        }

        // 2. 기존 태그 삭제
        const deleteTagsQuery = `
            DELETE FROM EventTags WHERE event_id = ?
        `;

        pool.query(deleteTagsQuery, [id], (err) => {
            if (err) {
                console.error('기존 태그 삭제 실패:', err);
                return res.status(500).json({ success: false, message: '태그 업데이트 실패' });
            }

            // 3. 새로운 태그 추가
            if (tags && tags.length > 0) {
                // 태그 이름을 ID로 변환
                const tagPromises = tags.map(tagName => {
                    return new Promise((resolve, reject) => {
                        const query = `SELECT id FROM Tags WHERE name = ?`;
                        pool.query(query, [tagName], (err, results) => {
                            if (err) return reject(err);
                            if (results.length > 0) {
                                resolve(results[0].id); // 기존 태그 ID 반환
                            } else {
                                // 태그가 없으면 새로 생성
                                const insertTagQuery = `INSERT INTO Tags (name) VALUES (?)`;
                                pool.query(insertTagQuery, [tagName], (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result.insertId); // 새로 생성된 태그 ID 반환
                                });
                            }
                        });
                    });
                });

                // 모든 태그 처리 후 EventTags에 삽입
                Promise.all(tagPromises)
                    .then(tagIds => {
                        const insertTagsQuery = `
                            INSERT INTO EventTags (event_id, tag_id)
                            VALUES ?
                        `;
                        const values = tagIds.map(tagId => [id, tagId]);

                        pool.query(insertTagsQuery, [values], (err) => {
                            if (err) {
                                console.error('태그 추가 실패:', err);
                                return res.status(500).json({ success: false, message: '태그 추가 실패' });
                            }

                            res.json({ success: true });
                        });
                    })
                    .catch(err => {
                        console.error('태그 처리 중 실패:', err);
                        res.status(500).json({ success: false, message: '태그 처리 실패' });
                    });
            } else {
                // 태그가 없으면 그냥 성공 응답
                res.json({ success: true });
            }
        });
    });
});


// 이벤트 삭제 API
router.delete('/:id(\\d+)', (req, res) => {
    const { id } = req.params;

    // 1. EventTags에서 해당 이벤트와 관련된 태그 삭제
    const deleteEventTagsQuery = `DELETE FROM EventTags WHERE event_id = ?`;

    pool.query(deleteEventTagsQuery, [id], (err) => {
        if (err) {
            console.error('EventTags 삭제 실패:', err);
            return res.status(500).json({ success: false, message: '태그 삭제 실패' });
        }

        // 2. Events 테이블에서 이벤트 삭제
        const deleteEventQuery = `DELETE FROM Events WHERE id = ?`;

        pool.query(deleteEventQuery, [id], (err) => {
            if (err) {
                console.error('이벤트 삭제 실패:', err);
                return res.status(500).json({ success: false, message: '이벤트 삭제 실패' });
            }
            res.json({ success: true });
        });
    });
});



router.get('/:id(\\d+)', (req, res) => {
    const { id } = req.params;
    const selectQuery = `
        SELECT 
            e.*, 
            GROUP_CONCAT(et.tag_id) AS tags
        FROM 
            Events e
        LEFT JOIN 
            EventTags et ON e.id = et.event_id
        WHERE 
            e.id = ?
        GROUP BY 
            e.id
    `;

    pool.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('이벤트 조회 실패:', err);
            return res.status(500).json({ success: false, message: '이벤트 조회 실패' });
        }

        if (results.length === 0) {
            console.log('이벤트를 찾을 수 없습니다:', id);
            return res.status(404).json({ success: false, message: '이벤트를 찾을 수 없습니다.' });
        }

        // 태그 ID 문자열을 배열로 변환
        const event = results[0];
        event.tags = event.tags ? event.tags.split(',').map(Number) : [];

        res.json(event);
    });
});


router.get('/tags', (req, res) => {    
    const query = `SELECT * FROM Tags`;
    pool.query(query, (err, results) => {
        if (err) {
            console.error('태그 조회 실패:', err);
            return res.status(500).json({ success: false });
        }
        res.json(results);
    });
});


router.post('/tags', (req, res) => {
    const { name, color } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: '태그 이름이 필요합니다.' });
    }

    const query = `INSERT INTO Tags (name, color) VALUES (?, ?)`;
    pool.query(query, [name, color || '#FFFFFF'], (err, result) => {
        if (err) {
            console.error('태그 추가 실패:', err);
            return res.status(500).json({ success: false, message: '태그 추가 실패' });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// 태그 삭제 API
router.delete('/tags/:id', (req, res) => {
    const { id } = req.params;

    const deleteTagQuery = `DELETE FROM Tags WHERE id = ?`;

    pool.query(deleteTagQuery, [id], (err, result) => {
        if (err) {
            console.error('태그 삭제 실패:', err);
            return res.status(500).json({ success: false, message: '태그 삭제 실패' });
        }

        /*
        // 삭제 성공 시 관련 EventTags도 삭제
        const deleteEventTagsQuery = `DELETE FROM EventTags WHERE tag_id = ?`;
        pool.query(deleteEventTagsQuery, [id], (err) => {
            if (err) {
                console.error('관련 EventTags 삭제 실패:', err);
                return res.status(500).json({ success: false, message: '관련 EventTags 삭제 실패' });
            }

            res.json({ success: true, message: '태그가 삭제되었습니다.' });
        });
        */
    });
});

// 태그 색상 변경 API
router.put('/tags/:id', (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;

    const query = `UPDATE Tags SET name = ?, color = ? WHERE id = ?`;
    pool.query(query, [name, color, id], (err, result) => {
        if (err) {
            console.error('태그 수정 실패:', err);
            return res.status(500).json({ success: false, message: '태그 수정 실패' });
        }
        res.json({ success: true });
    });
});


// 검색 API
router.get('/search', (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, message: '검색어가 제공되지 않았습니다.' });
    }

    const searchQuery = `
        SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
               JSON_ARRAYAGG(t.name) AS tags
        FROM Events e
        LEFT JOIN EventTags et ON e.id = et.event_id
        LEFT JOIN Tags t ON et.tag_id = t.id
        WHERE e.title LIKE ? OR e.description LIKE ?
        GROUP BY e.id
    `;

    const searchTerm = `%${query}%`;

    pool.query(searchQuery, [searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('검색 실패:', err);
            return res.status(500).json({ success: false, message: '검색 실패' });
        }

        res.json({ success: true, events: results });
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


