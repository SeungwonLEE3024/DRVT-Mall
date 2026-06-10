const express = require('express');
const { getMe, updateMe } = require('../controllers/user.controller');
const { updateProfileRules } = require('../validators/user.validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// JWT 인증을 통과한 현재 로그인 사용자의 프로필 정보를 조회합니다.
router.get('/me', auth, getMe);

// JWT 인증을 통과한 현재 로그인 사용자의 이름, 배송지, 마케팅 수신 여부 등을 수정합니다.
router.patch('/me', auth, updateProfileRules, validate, updateMe);

module.exports = router;
