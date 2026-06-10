const mongoose = require('mongoose');

// 장바구니에 담긴 개별 상품 정보를 정의합니다.
const cartItemSchema = new mongoose.Schema(
  {
    // 장바구니에 담긴 실제 상품 문서를 참조합니다.
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    // 같은 상품을 몇 개 담았는지 저장합니다.
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be greater than or equal to 1'],
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    // 상품이 장바구니에 추가된 시간을 저장합니다.
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// 사용자별 장바구니를 정의합니다. 한 사용자는 하나의 장바구니만 가집니다.
const cartSchema = new mongoose.Schema(
  {
    // 장바구니 소유자를 User 컬렉션과 연결합니다.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    // 장바구니에 담긴 상품 목록입니다.
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// 장바구니에 상품을 추가합니다. 이미 담긴 상품이면 수량만 증가시킵니다.
cartSchema.methods.addItem = function (productId, quantity = 1) {
  const existingItem = this.items.find((item) => item.product.toString() === productId.toString());

  if (existingItem) {
    existingItem.quantity += quantity;
    return this;
  }

  this.items.push({ product: productId, quantity });
  return this;
};

// 장바구니에 담긴 특정 상품의 수량을 변경합니다.
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.items.find((cartItem) => cartItem.product.toString() === productId.toString());

  if (!item) {
    return this;
  }

  item.quantity = quantity;
  return this;
};

// 장바구니에서 특정 상품을 제거합니다.
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter((item) => item.product.toString() !== productId.toString());
  return this;
};

// 장바구니에 담긴 모든 상품을 비웁니다.
cartSchema.methods.clear = function () {
  this.items = [];
  return this;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
