const mongoose = require('mongoose');

// Mongoose 연결 상태 코드를 사람이 읽기 쉬운 문자열로 변환합니다.
const DB_STATUS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// 서버와 MongoDB 연결 상태를 확인하는 헬스체크 응답을 반환합니다.
const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.json({
    success: true,
    message: 'DRVT Mall API is running',
    timestamp: new Date().toISOString(),
    database: DB_STATUS[dbState] || 'unknown',
  });
};

module.exports = { getHealth };
