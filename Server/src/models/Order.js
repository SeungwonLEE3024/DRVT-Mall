const mongoose = require('mongoose');

// 주문 상태, 결제 상태, 결제수단 허용 값 목록입니다.
const ORDER_STATUSES = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_METHODS = ['CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS_PAY'];

const orderSchema = new mongoose.Schema(
  {
    // 사람이 확인하기 쉬운 고유 주문번호입니다. 예: DRVT-20260609-000001
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    // 주문한 사용자를 User 컬렉션과 연결합니다.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    // 주문 진행 상태입니다. 정상 흐름은 PENDING -> PAID -> PREPARING -> SHIPPED -> DELIVERED 입니다.
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'PENDING',
      required: true,
    },
    // 상품 금액, 배송비, 할인금액을 반영한 최종 결제 대상 금액입니다.
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be greater than or equal to 0'],
    },
    // 배송비
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, 'Shipping fee must be greater than or equal to 0'],
    },
    // 할인 금액
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount must be greater than or equal to 0'],
    },
    // 결제 수단 (카드, 계좌이체, 간편결제 등)
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: [true, 'Payment method is required'],
    },
    // 결제 진행 상태
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      required: true,
    },
    // 결제 완료 일시
    paidAt: {
      type: Date,
    },
    // 포트원 결제 고유번호 (중복 주문 방지용, 결제 검증 후 저장)
    paymentId: {
      type: String,
      trim: true,
    },
  },
  // createdAt, updatedAt 자동 기록
  { timestamps: true }
);

// 자주 사용하는 조회 패턴(내 주문 최신순, 주문번호 검색, 상태별 목록)을 위한 인덱스입니다.
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1, createdAt: -1 });
// 같은 결제 건으로 주문이 중복 생성되는 것을 방지하는 유니크 인덱스입니다. (paymentId가 있는 문서만 적용)
orderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
