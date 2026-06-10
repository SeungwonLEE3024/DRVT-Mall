const jwt = require('jsonwebtoken');

// JWT 토큰 유효 기간 (3일)
const JWT_EXPIRES_IN = '3d';

// 사용자 정보(userId, email, role)를 담은 JWT 토큰을 발급합니다.
const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// JWT 토큰을 검증하고 payload를 반환합니다. 위조/만료 시 예외가 발생합니다.
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret);
};

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
