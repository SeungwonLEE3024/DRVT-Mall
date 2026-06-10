// 모든 라우트에서 발생한 오류를 일관된 JSON 형식으로 응답하는 전역 오류 처리 미들웨어입니다.
const errorHandler = (err, req, res, next) => {
  // 상태 코드가 지정되지 않았다면 500(서버 오류)으로 처리합니다.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // 개발 환경에서만 스택 트레이스를 포함해 디버깅을 돕습니다.
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
