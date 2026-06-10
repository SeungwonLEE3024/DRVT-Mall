const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

// /api/health 하위의 서버 상태 확인 라우트를 연결합니다.
router.use('/health', healthRoutes);

// /api/auth 하위의 이메일 OTP 및 소셜 로그인 라우트를 연결합니다.
router.use('/auth', authRoutes);

// /api/users 하위의 내 프로필 조회/수정 라우트를 연결합니다.
router.use('/users', userRoutes);

// /api/products 하위의 상품 조회 및 관리자 상품 관리 라우트를 연결합니다.
router.use('/products', productRoutes);

// /api/cart 하위의 로그인 사용자 장바구니 CRUD 라우트를 연결합니다.
router.use('/cart', cartRoutes);

// /api/orders 하위의 주문 생성, 조회, 수정, 삭제 라우트를 연결합니다.
router.use('/orders', orderRoutes);

module.exports = router;
