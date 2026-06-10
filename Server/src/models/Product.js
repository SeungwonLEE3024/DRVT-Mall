const mongoose = require('mongoose');

// 상품 정보를 저장하는 스키마입니다.
const productSchema = new mongoose.Schema(
  {
    // 상품 고유 코드 (중복 불가, 대문자로 저장)
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // 상품명
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    // 판매 가격
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price must be greater than or equal to 0'],
    },
    // 정가 (할인 표시용, 선택)
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be greater than or equal to 0'],
    },
    // 화폐 단위 (기본 KRW)
    currency: {
      type: String,
      enum: ['KRW', 'USD'],
      default: 'KRW',
      uppercase: true,
      trim: true,
    },
    // 재고 수량 (0 이상의 정수)
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Product stock must be greater than or equal to 0'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Product stock must be an integer',
      },
    },
    // 상품 카테고리
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    // 대표 이미지 URL
    image: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    // 추가 이미지 URL 목록
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    // 상품 상세 설명 (HTML)
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // 주문 이력이 있는 상품은 문서를 보존하되 외부 노출에서 제외합니다.
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  // createdAt, updatedAt 자동 기록
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
