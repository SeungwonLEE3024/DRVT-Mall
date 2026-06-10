const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/order.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const {
  orderIdRule,
  orderPaginationRules,
  createOrderRules,
  updateOrderRules,
} = require('../validators/order.validator');

const router = express.Router();

// 주문 API는 모두 로그인 사용자 기준으로 동작합니다.
router.use(auth);

// 로그인 사용자의 주문 목록을 조회합니다. 관리자는 전체 주문을 조회합니다.
router.get('/', orderPaginationRules, validate, getOrders);

// 로그인 사용자의 주문 상세를 조회합니다. 관리자는 모든 주문을 조회할 수 있습니다.
router.get('/:id', orderIdRule, validate, getOrder);

// 로그인 사용자가 상품 목록과 배송지 정보로 새 주문을 생성합니다.
router.post('/', createOrderRules, validate, createOrder);

// 관리자가 주문 상태, 결제 상태, 결제수단, 결제시각을 수정합니다.
router.patch('/:id', admin, updateOrderRules, validate, updateOrder);

// 관리자가 주문과 주문 상품, 배송지 데이터를 삭제합니다.
router.delete('/:id', admin, orderIdRule, validate, deleteOrder);

module.exports = router;
