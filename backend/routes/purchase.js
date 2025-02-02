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
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: '취합 제목이 필요합니다.' });

    const query = `INSERT INTO PurchaseRequests (title) VALUES (?)`;
    pool.query(query, [title], (err, result) => {
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
    const { participant_id, item_name, specification, quantity, unit_price, delivery_fee, note } = req.body;
    if (!participant_id || !item_name || !quantity || !unit_price) {
        return res.status(400).json({ success: false, message: '필수 필드가 누락되었습니다.' });
    }

    const query = `
        INSERT INTO PurchaseItems (participant_id, item_name, specification, quantity, unit_price, delivery_fee, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    pool.query(query, [participant_id, item_name, specification, quantity, unit_price, delivery_fee, note], (err, result) => {
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
    const { item_name, specification, quantity, unit_price, note, delivery_fee } = req.body;

    const query = `
        UPDATE PurchaseItems
        SET item_name = ?, specification = ?, quantity = ?, unit_price = ?, note = ?, delivery_fee = ?
        WHERE id = ?
    `;

    pool.query(query, [item_name, specification, quantity, unit_price, note, delivery_fee, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: '품목 수정 실패' });
        res.json({ success: true });
    });
});

module.exports = router;
