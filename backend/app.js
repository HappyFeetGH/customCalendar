const express = require('express');
const cors = require('cors');

const app = express();

const API_BASE_URL = "http://localhost";

// CORS 설정 (모든 출처 허용)
app.use(cors({
  origin: `${API_BASE_URL}:3000`,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// 라우트 설정
const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);


// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${API_BASE_URL}:${PORT}`));


