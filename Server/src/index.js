// .env 파일의 환경변수를 가장 먼저 로드합니다.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// MongoDB 연결 후 Express 서버를 시작합니다.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

startServer();
