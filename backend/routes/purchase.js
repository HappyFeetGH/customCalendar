const express = require('express');
const { pool } = require('../db/connection'); // MySQL 연결 풀 사용
const router = express.Router();

/**
 * [1] 취합 사유 (PurchaseRequests) API
 */

// 모든 취합 사유 조회
router.get('/requests', (req, res) => {
    const query = `SELECT * FROM PurchaseRequests ORDER BY created_at DESC`;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '취합 요청 로드 실패' });
        res.json(results);
    });
});

// 새로운 취합 사유 추가
router.post('/requests', (req, res) => {
    const { title, total_amount } = req.body;
    if (!title) return res.status(400).json({ success: false, message: '취합 제목이 필요합니다.' });
    if (!total_amount || isNaN(total_amount)) return res.status(400).json({ success: false, message: '총 금액이 유효하지 않습니다.' });

    const query = `INSERT INTO PurchaseRequests (title, total_amount) VALUES (?, ?)`;
    pool.query(query, [title, total_amount], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '취합 요청 저장 실패' });
        res.json({ success: true, id: result.insertId });
    });
});

// 취합 사유 삭제
router.delete('/requests/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM PurchaseRequests WHERE id = ?`;
    pool.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '취합 요청 삭제 실패' });
        res.json({ success: true });
    });
});


// 취합 사유별 총액 업데이트
router.put('/requests/:id/total', (req, res) => {
    const { id } = req.params;
    
    const query = `
        UPDATE PurchaseRequests
        SET total_amount = (
            SELECT COALESCE(SUM(quantity * unit_price + delivery_fee), 0)
            FROM PurchaseItems
            WHERE participant_id IN (
                SELECT id FROM PurchaseParticipants WHERE request_id = ?
            )
        )
        WHERE id = ?;
    `;

    pool.query(query, [id, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '총액 업데이트 실패' });
        res.json({ success: true });
    });
});

// 취합 사유 수정
router.put('/requests/:id', (req, res) => {
    const { id } = req.params;
    const { title, total_amount } = req.body;

    if (!title || isNaN(total_amount) || total_amount < 0) {
        return res.status(400).json({ success: false, message: "유효한 데이터가 필요합니다." });
    }

    const query = `UPDATE PurchaseRequests SET title = ?, total_amount = ? WHERE id = ?`;
    pool.query(query, [title, total_amount, id], (err, result) => {
        if (err) {
            console.error("❌ 취합 사유 수정 오류:", err);
            return res.status(500).json({ success: false, message: "수정 실패" });
        }
        res.json({ success: true });
    });
});


/**
 * [2] 취합 대상자 (PurchaseParticipants) API
 */

// 특정 취합 요청의 대상자 조회
router.get('/participants/:request_id', (req, res) => {
    const { request_id } = req.params;
    const query = `SELECT * FROM PurchaseParticipants WHERE request_id = ? ORDER BY created_at DESC`;
    pool.query(query, [request_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '취합 대상자 로드 실패' });
        res.json(results);
    });
});

// 새로운 취합 대상자 추가
router.post('/participants', (req, res) => {
    const { request_id, participant_name } = req.body;
    if (!request_id || !participant_name) {
        return res.status(400).json({ success: false, message: '취합 ID와 대상자 이름이 필요합니다.' });
    }
    
    const query = `INSERT INTO PurchaseParticipants (request_id, participant_name) VALUES (?, ?)`;
    pool.query(query, [Number(request_id), participant_name], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '취합 대상자 저장 실패' });
        res.json({ success: true, id: result.insertId });
    });
});

// 취합 대상자 삭제
router.delete('/participants/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM PurchaseParticipants WHERE id = ?`;
    pool.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '취합 대상자 삭제 실패' });
        res.json({ success: true });
    });
});


/**
 * [3] 품목 (PurchaseItems) API
 */

// 특정 대상자의 품목 조회
router.get('/items/:participant_id', (req, res) => {
    const { participant_id } = req.params;
    const query = `SELECT * FROM PurchaseItems WHERE participant_id = ? ORDER BY created_at DESC`;
    pool.query(query, [participant_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '품목 로드 실패' });
        res.json(results);
    });
});

// 품목 추가
router.post('/items', (req, res) => {
    let { participant_id, item_name, specification, quantity, unit, unit_price, purchase_place, delivery_fee, note } = req.body;
    if (!participant_id || !item_name || !quantity || !unit_price) {
        return res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' });
    }
    if (!delivery_fee) {delivery_fee = 0};
    const query = `
        INSERT INTO PurchaseItems (participant_id, item_name, specification, quantity, unit, unit_price, purchase_place, delivery_fee, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    pool.query(query, [participant_id, item_name, specification, quantity, unit, unit_price, purchase_place, delivery_fee, note], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '품목 저장 실패' });
        res.json({ success: true, id: result.insertId });
    });
});

// 품목 삭제
router.delete('/items/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM PurchaseItems WHERE id = ?`;
    pool.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '품목 삭제 실패' });
        res.json({ success: true });
    });
});

// 🔹 품목 수정 (PUT 요청)
router.put('/items/:id', (req, res) => {
    const { id } = req.params;
    let { item_name, specification, quantity, unit, unit_price, purchase_place, delivery_fee, note } = req.body;

    if(!delivery_fee){delivery_fee=0};

    const query = `
        UPDATE PurchaseItems
        SET item_name = ?, specification = ?, quantity = ?, unit=?, unit_price = ?, purchase_place =? , delivery_fee = ?, note  =?
        WHERE id = ?
    `;

    pool.query(query, [item_name, specification, quantity, unit, unit_price, purchase_place, delivery_fee, note, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '품목 수정 실패' });
        res.json({ success: true });
    });
});

// 특정 취합 대상자의 총 사용 금액 조회
router.get('/total-used/:participant_id', (req, res) => {
    const { participant_id } = req.params;
    const query = `
        SELECT SUM(quantity * unit_price + delivery_fee) AS total
        FROM PurchaseItems
        WHERE participant_id = ?
    `;

    pool.query(query, [participant_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '총 사용 금액 조회 실패' });
        res.json({ total: results[0]?.total || 0 });
    });
});


// 특정 취합 사유의 총 금액 조회
router.get('/request-total/:request_id', (req, res) => {
    const { request_id } = req.params;
    const query = `
        SELECT total_amount
        FROM PurchaseRequests
        WHERE id = ?
    `;

    pool.query(query, [request_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '취합 사유 총 금액 조회 실패' });
        res.json({ total: results[0]?.total_amount || 0 });
    });
});

// 취합 사유별 전체 물품 조회
router.get('/summary/:requestId', (req, res) => {
    const { requestId } = req.params;

    const query = `
        SELECT 
            item_name, 
            specification, 
            unit_price, 
            unit,
            purchase_place,
            note,
            delivery_fee,  -- 🔥 추가된 필드
            SUM(quantity) as total_quantity
        FROM PurchaseItems
        INNER JOIN PurchaseParticipants 
            ON PurchaseItems.participant_id = PurchaseParticipants.id
        WHERE PurchaseParticipants.request_id = ?
        GROUP BY item_name, specification, unit_price, unit, purchase_place, note, delivery_fee  -- 🔥 GROUP BY 추가
    `;
    pool.query(query, [requestId], (err, results) => {
        if (err) {
            console.error("❌ 물품 집계 조회 오류:", err);
            return res.status(500).json({ success: false, message: "물품 조회 실패" });
        }
        res.json(results);
    });
});

//export 엑셀 데이터 만들기용
router.get('/items/summary/:requestId', (req, res) => {
    const { requestId } = req.params;

    const query = `
        SELECT 
            pi.item_name, 
            pi.specification, 
            pi.unit_price, 
            pi.quantity, 
            p.participant_name
        FROM PurchaseItems pi
        JOIN PurchaseParticipants p ON pi.participant_id = p.id
        WHERE p.request_id = ?;
    `;

    pool.query(query, [requestId], (err, results) => {
        if (err) {
            console.error("Summary Data Fetch Error:", err);
            return res.status(500).json({ success: false, message: "Summary 데이터 로드 실패" });
        }
        res.json(results);
    });
});

module.exports = router;
