const express = require('express');
const connection = require('../../frontend/db/connection');
const router = express.Router();

// 모든 이벤트 가져오기
router.get('/', (req, res) => {
  const sql = `SELECT * FROM Events`;
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// 새로운 이벤트 추가
router.post('/', (req, res) => {
  const { title, description, start_datetime, end_datetime, tag_id, created_by } = req.body;
  const sql = `INSERT INTO Events (title, description, start_datetime, end_datetime, tag_id, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(sql, [title, description, start_datetime, end_datetime, tag_id, created_by], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: results.insertId, ...req.body });
  });
});

// 특정 이벤트 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, start_datetime, end_datetime, tag_id } = req.body;
  const sql = `UPDATE Events SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, tag_id = ? WHERE id = ?`;
  connection.query(sql, [title, description, start_datetime, end_datetime, tag_id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Event updated successfully' });
  });
});

// 특정 이벤트 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM Events WHERE id = ?`;
  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Event deleted successfully' });
  });
});

module.exports = router;
