const { body, param } = require('express-validator');

// URL 파라미터의 상품 ID가 유효한 MongoDB ObjectId인지 검증합니다.
const productIdParamRule = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product id'),
];

// 장바구니 상품 추가 시 상품 ID와 수량(1 이상)을 검증합니다.
const addCartItemRules = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product id'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be greater than or equal to 1'),
];

// 장바구니 수량 변경 시 상품 ID와 수량(1 이상)을 검증합니다.
const updateCartItemRules = [
  ...productIdParamRule,
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be greater than or equal to 1'),
];

module.exports = {
  productIdParamRule,
  addCartItemRules,
  updateCartItemRules,
};
