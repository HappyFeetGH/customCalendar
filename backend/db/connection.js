const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // 연결 제한 설정
  queueLimit: 0, // 대기열 제한 없음
});

console.log('Database pool created.');


module.exports = {
  pool,
  promisePool: pool.promise(), // Promise 기반과 기존 방식을 모두 지원
};