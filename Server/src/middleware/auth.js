const User = require('../models/User');
const { verifyToken } = require('../utils/token');

// JWT 토큰을 검증하고 해당 사용자를 req.user에 담아주는 인증 미들웨어입니다.
const auth = async (req, res, next) => {
  try {
    // Authorization 헤더에서 "Bearer {토큰}" 형식을 확인합니다.
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required',
      });
    }

    // 토큰을 검증하고 토큰에 담긴 userId로 사용자를 조회합니다.
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // 이후 미들웨어/컨트롤러에서 사용할 수 있도록 사용자 정보를 요청 객체에 저장합니다.
    req.user = user;
    next();
  } catch (error) {
    // 토큰이 위조되었거나 만료된 경우입니다.
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};

module.exports = auth;
