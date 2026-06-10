const { validationResult } = require('express-validator');

// express-validator 검증 결과를 확인해 오류가 있으면 400 응답을 반환하는 미들웨어입니다.
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 어떤 필드가 왜 실패했는지 목록으로 정리해 응답합니다.
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validate;
