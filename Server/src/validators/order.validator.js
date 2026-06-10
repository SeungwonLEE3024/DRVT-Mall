const { body, param, query } = require('express-validator');

// 주문/결제 상태 및 결제수단 허용 값 목록입니다. (Order 모델과 동일하게 유지)
const ORDER_STATUSES = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_METHODS = ['CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS_PAY'];

// URL 파라미터의 주문 ID가 유효한 MongoDB ObjectId인지 검증합니다.
const orderIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order id'),
];

// 주문 목록 조회 시 페이지네이션 쿼리(page, limit)를 검증합니다.
const orderPaginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be greater than or equal to 1'),
];

// 주문 생성 시 주문 상품, 배송지, 결제 정보를 검증합니다.
const createOrderRules = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order items are required'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product id'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be greater than or equal to 1'),
  body('shippingAddress.recipientName')
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required'),
  body('shippingAddress.recipientPhone')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone is required'),
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.address1')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('shippingAddress.address2')
    .optional()
    .trim(),
  body('shippingAddress.deliveryMemo')
    .optional()
    .trim(),
  body('shippingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be greater than or equal to 0'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be greater than or equal to 0'),
  body('paymentMethod')
    .isIn(PAYMENT_METHODS)
    .withMessage('Invalid payment method'),
  body('paymentId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Payment id cannot be empty'),
];

// 주문 수정(관리자) 시 상태/결제 관련 필드를 선택적으로 검증합니다.
const updateOrderRules = [
  ...orderIdRule,
  body('status')
    .optional()
    .isIn(ORDER_STATUSES)
    .withMessage('Invalid order status'),
  body('paymentStatus')
    .optional()
    .isIn(PAYMENT_STATUSES)
    .withMessage('Invalid payment status'),
  body('paymentMethod')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage('Invalid payment method'),
  body('paidAt')
    .optional()
    .isISO8601()
    .withMessage('Paid at must be a valid date'),
];

module.exports = {
  orderIdRule,
  orderPaginationRules,
  createOrderRules,
  updateOrderRules,
};
