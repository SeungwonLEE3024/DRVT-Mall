const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const {
  mongoIdRule,
  productPaginationRules,
  createProductRules,
  updateProductRules,
} = require('../validators/product.validator');

const router = express.Router();

// 전체 상품 목록을 페이지네이션으로 조회합니다. 쇼핑몰 화면에서도 필요하므로 공개 API로 제공합니다.
router.get('/', productPaginationRules, validate, getProducts);

// 상품 ID로 단일 상품의 상세 정보를 조회합니다.
router.get('/:id', mongoIdRule, validate, getProduct);

// 인증된 관리자만 새 상품을 등록할 수 있습니다.
router.post('/', auth, admin, createProductRules, validate, createProduct);

// 인증된 관리자만 기존 상품 정보를 수정할 수 있습니다.
router.patch('/:id', auth, admin, updateProductRules, validate, updateProduct);

// 인증된 관리자만 상품을 삭제할 수 있습니다.
router.delete('/:id', auth, admin, mongoIdRule, validate, deleteProduct);

module.exports = router;
