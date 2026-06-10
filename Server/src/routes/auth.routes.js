const express = require('express');
const {
  requestCode,
  verifyCode,
  kakaoLogin,
  kakaoCallback,
  googleLogin,
  googleCallback,
  naverLogin,
  naverCallback,
} = require('../controllers/auth.controller');
const { requestCodeRules, verifyCodeRules } = require('../validators/auth.validator');
const validate = require('../middleware/validate');

const router = express.Router();

// 이메일을 받아 OTP 인증코드를 생성하고 사용자 이메일로 발송합니다.
router.post('/request-code', requestCodeRules, validate, requestCode);

// 사용자가 입력한 OTP 인증코드를 검증하고 로그인/회원가입 처리를 완료합니다.
router.post('/verify-code', verifyCodeRules, validate, verifyCode);

// 카카오 OAuth 로그인 화면으로 사용자를 이동시킵니다.
router.get('/kakao', kakaoLogin);

// 카카오 OAuth 인증 완료 후 사용자 정보를 받아 로그인/회원가입을 처리합니다.
router.get('/kakao/callback', kakaoCallback);

// 구글 OAuth 로그인 화면으로 사용자를 이동시킵니다.
router.get('/google', googleLogin);

// 구글 OAuth 인증 완료 후 사용자 정보를 받아 로그인/회원가입을 처리합니다.
router.get('/google/callback', googleCallback);

// 네이버 OAuth 로그인 화면으로 사용자를 이동시킵니다.
router.get('/naver', naverLogin);

// 네이버 OAuth 인증 완료 후 사용자 정보를 받아 로그인/회원가입을 처리합니다.
router.get('/naver/callback', naverCallback);

module.exports = router;
