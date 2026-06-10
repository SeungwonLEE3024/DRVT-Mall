const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 클라이언트 응답에 사용할 장바구니 데이터 형태를 통일합니다.
const formatCart = (cart) => {
  const items = cart.items.map((item) => {
    const product = item.product;
    const itemPrice = product?.price || 0;
    const subtotal = itemPrice * item.quantity;

    return {
      id: item._id,
      product: product?._id
        ? {
            id: product._id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            stock: product.stock,
            category: product.category,
            image: product.image,
          }
        : product,
      quantity: item.quantity,
      subtotal,
      addedAt: item.addedAt,
    };
  });

  return {
    id: cart._id,
    user: cart.user,
    items,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: items.reduce((total, item) => total + item.subtotal, 0),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

// 현재 로그인 사용자의 장바구니를 찾고, 없으면 새로 만듭니다.
const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

// 응답 직전에 상품 정보를 채워 장바구니 데이터를 완성합니다.
const populateCart = (cart) => cart.populate('items.product');

// 로그인한 사용자의 장바구니를 조회합니다.
const getCart = async (req, res, next) => {
  try {
    const cart = await findOrCreateCart(req.user._id);
    await populateCart(cart);

    res.json({
      success: true,
      cart: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// 장바구니에 상품을 추가합니다. 이미 담긴 상품이면 수량을 더합니다.
const addCartItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity || 1);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    const cart = await findOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    const nextQuantity = (existingItem?.quantity || 0) + quantity;

    if (product.stock < nextQuantity) {
      return res.status(400).json({
        success: false,
        code: 'OUT_OF_STOCK',
        message: 'Requested quantity exceeds product stock',
      });
    }

    cart.addItem(productId, quantity);
    await cart.save();
    await populateCart(cart);

    res.status(201).json({
      success: true,
      message: 'Cart item added successfully',
      cart: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// 장바구니에 담긴 특정 상품의 수량을 변경합니다.
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        code: 'OUT_OF_STOCK',
        message: 'Requested quantity exceeds product stock',
      });
    }

    const cart = await findOrCreateCart(req.user._id);
    const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);

    if (!item) {
      return res.status(404).json({
        success: false,
        code: 'CART_ITEM_NOT_FOUND',
        message: 'Cart item not found',
      });
    }

    cart.updateItemQuantity(productId, quantity);
    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      cart: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// 장바구니에서 특정 상품을 제거합니다.
const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await findOrCreateCart(req.user._id);

    cart.removeItem(productId);
    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: 'Cart item removed successfully',
      cart: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// 장바구니에 담긴 모든 상품을 비웁니다.
const clearCart = async (req, res, next) => {
  try {
    const cart = await findOrCreateCart(req.user._id);

    cart.clear();
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
