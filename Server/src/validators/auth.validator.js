const { body } = require('express-validator');

// 인증코드 요청(/auth/request-code) 시 이메일 형식을 검증합니다.
const requestCodeRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

// 인증코드 검증(/auth/verify-code) 시 이메일과 6자리 숫자 코드를 검증합니다.
const verifyCodeRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
];

module.exports = { requestCodeRules, verifyCodeRules };
