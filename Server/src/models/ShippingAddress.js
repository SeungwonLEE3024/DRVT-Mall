const mongoose = require('mongoose');

// 주문의 배송지 정보를 저장하는 스키마입니다.
const shippingAddressSchema = new mongoose.Schema(
  {
    // 하나의 주문은 하나의 배송지만 가지는 1:1 관계입니다.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true,
      index: true,
    },
    // 받는 사람 이름
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    // 받는 사람 연락처
    recipientPhone: {
      type: String,
      required: [true, 'Recipient phone is required'],
      trim: true,
    },
    // 우편번호
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    // 기본 주소
    address1: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    // 상세 주소 (선택)
    address2: {
      type: String,
      trim: true,
      default: '',
    },
    // 배송 요청사항 (선택)
    deliveryMemo: {
      type: String,
      trim: true,
      default: '',
    },
  },
  // createdAt, updatedAt 자동 기록
  { timestamps: true }
);

module.exports = mongoose.model('ShippingAddress', shippingAddressSchema);
