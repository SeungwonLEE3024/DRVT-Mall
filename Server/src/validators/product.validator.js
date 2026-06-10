const { body, param, query } = require('express-validator');

// URL 파라미터의 상품 ID가 유효한 MongoDB ObjectId인지 검증합니다.
const mongoIdRule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product id'),
];

// 상품 목록 조회 시 페이지네이션 쿼리(page, limit)를 검증합니다.
const productPaginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be greater than or equal to 1'),
];

// 상품 등록 시 필수/선택 필드의 형식을 검증합니다.
const createProductRules = [
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Product price must be greater than or equal to 0'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be greater than or equal to 0'),
  body('currency')
    .optional()
    .isIn(['KRW', 'USD'])
    .withMessage('Currency must be KRW or USD'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Product stock must be an integer greater than or equal to 0'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('image')
    .trim()
    .notEmpty()
    .withMessage('Product image is required'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Product images must be an array'),
  body('images.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product image URL cannot be empty'),
  body('description')
    .optional()
    .trim(),
];

// 상품 수정 시 전달된 필드만 선택적으로 검증합니다.
const updateProductRules = [
  ...mongoIdRule,
  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Product price must be greater than or equal to 0'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be greater than or equal to 0'),
  body('currency')
    .optional()
    .isIn(['KRW', 'USD'])
    .withMessage('Currency must be KRW or USD'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Product stock must be an integer greater than or equal to 0'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('image')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product image cannot be empty'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Product images must be an array'),
  body('images.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product image URL cannot be empty'),
  body('description')
    .optional()
    .trim(),
];

module.exports = { mongoIdRule, productPaginationRules, createProductRules, updateProductRules };
