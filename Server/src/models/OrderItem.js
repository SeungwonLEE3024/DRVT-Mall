const mongoose = require('mongoose');

// 주문에 포함된 개별 상품 정보를 저장하는 스키마입니다.
const orderItemSchema = new mongoose.Schema(
  {
    // 여러 주문 상품이 하나의 주문에 속하는 1:N 관계입니다.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      index: true,
    },
    // 현재 상품 문서로 이동할 수 있게 Product 참조를 남깁니다.
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    // 아래 스냅샷 필드는 상품이 나중에 수정되어도 주문 당시 기록을 보존합니다.
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productSku: {
      type: String,
      required: [true, 'Product SKU is required'],
      trim: true,
      uppercase: true,
    },
    // 주문 당시 단가
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be greater than or equal to 0'],
    },
    // 주문 당시 화폐 단위
    currency: {
      type: String,
      enum: ['KRW', 'USD'],
      default: 'KRW',
      uppercase: true,
      trim: true,
    },
    // 주문 수량 (1 이상의 정수)
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be greater than or equal to 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    // 항목 합계 금액 (단가 × 수량)
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total must be greater than or equal to 0'],
    },
  },
  // createdAt, updatedAt 자동 기록
  { timestamps: true }
);

// 주문별 상품 조회를 빠르게 하기 위한 복합 인덱스입니다.
orderItemSchema.index({ order: 1, product: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
