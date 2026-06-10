const express = require('express');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  productIdParamRule,
  addCartItemRules,
  updateCartItemRules,
} = require('../validators/cart.validator');

const router = express.Router();

// 장바구니 API는 모두 로그인한 사용자 기준으로 동작합니다.
router.use(auth);

// 현재 로그인 사용자의 장바구니를 조회합니다.
router.get('/', getCart);

// 장바구니에 상품을 추가합니다. 이미 담긴 상품이면 수량이 증가합니다.
router.post('/items', addCartItemRules, validate, addCartItem);

// 장바구니에 담긴 특정 상품의 수량을 변경합니다.
router.patch('/items/:productId', updateCartItemRules, validate, updateCartItem);

// 장바구니에서 특정 상품을 제거합니다.
router.delete('/items/:productId', productIdParamRule, validate, removeCartItem);

// 장바구니에 담긴 모든 상품을 제거합니다.
router.delete('/', clearCart);

module.exports = router;
