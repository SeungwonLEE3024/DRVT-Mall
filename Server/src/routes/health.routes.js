const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

// 서버와 데이터베이스 연결 상태를 확인하는 헬스체크 엔드포인트입니다.
router.get('/', getHealth);

module.exports = router;
