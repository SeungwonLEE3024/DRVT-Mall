// 등록되지 않은 경로로 들어온 요청에 404 응답을 반환하는 미들웨어입니다.
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFound;
