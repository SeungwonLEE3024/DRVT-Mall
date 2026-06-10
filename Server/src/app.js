const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Express 애플리케이션 인스턴스를 생성합니다.
const app = express();

// 공통 미들웨어: CORS 허용, JSON/폼 본문 파싱
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 테스트 환경이 아닐 때만 HTTP 요청 로그를 출력합니다.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 루트 경로: API 동작 확인용 환영 메시지를 반환합니다.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to DRVT Mall API',
    docs: '/api/health',
  });
});

// /api 하위에 모든 기능 라우트를 연결합니다.
app.use('/api', routes);

// 등록되지 않은 경로(404)와 서버 오류를 처리하는 미들웨어입니다.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
