const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const ShippingAddress = require('../models/ShippingAddress');
const { verifyPayment } = require('../services/portone');

// 주문 목록 페이지네이션 기본값
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// 날짜와 랜덤 문자열을 조합해 고유 주문번호를 생성합니다. 예: DRVT-20260610-A1B2C3
const generateOrderNumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `DRVT-${yyyy}${mm}${dd}-${random}`;
};

// 주문, 주문 상품, 배송지를 클라이언트 응답 형식으로 변환합니다.
const formatOrder = (order, items = [], shippingAddress = null) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  user: order.user,
  status: order.status,
  totalAmount: order.totalAmount,
  shippingFee: order.shippingFee,
  discountAmount: order.discountAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  paymentId: order.paymentId,
  paidAt: order.paidAt,
  items: items.map((item) => ({
    id: item._id,
    product: item.product,
    productName: item.productName,
    productSku: item.productSku,
    unitPrice: item.unitPrice,
    currency: item.currency,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  })),
  shippingAddress: shippingAddress && {
    id: shippingAddress._id,
    recipientName: shippingAddress.recipientName,
    recipientPhone: shippingAddress.recipientPhone,
    zipCode: shippingAddress.zipCode,
    address1: shippingAddress.address1,
    address2: shippingAddress.address2,
    deliveryMemo: shippingAddress.deliveryMemo,
  },
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

// 주문에 연결된 주문 상품 목록과 배송지를 함께 조회합니다.
const getOrderRelations = async (orderId) => {
  const [items, shippingAddress] = await Promise.all([
    OrderItem.find({ order: orderId }).populate('product'),
    ShippingAddress.findOne({ order: orderId }),
  ]);

  return { items, shippingAddress };
};

// 관리자이거나 본인의 주문인 경우에만 접근을 허용합니다.
const canAccessOrder = (req, order) =>
  req.user?.role === 'admin' || order.user.toString() === req.user._id.toString();

// 로그인 사용자의 주문 목록을 조회합니다. 관리자는 전체 주문을 조회할 수 있습니다.
const getOrders = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const skip = (page - 1) * limit;
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);

    // 주문 목록에 상품 이미지, 배송지 정보를 포함하기 위해 관련 데이터를 한 번에 조회합니다.
    const orderIds = orders.map((order) => order._id);
    const [orderItems, shippingAddresses] = await Promise.all([
      OrderItem.find({ order: { $in: orderIds } }).populate('product'),
      ShippingAddress.find({ order: { $in: orderIds } }),
    ]);
    const itemsByOrder = orderItems.reduce((map, item) => {
      const key = item.order.toString();

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);

      return map;
    }, new Map());
    const addressByOrder = new Map(
      shippingAddresses.map((address) => [address.order.toString(), address])
    );

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      orders: orders.map((order) => {
        const key = order._id.toString();

        return formatOrder(order, itemsByOrder.get(key) || [], addressByOrder.get(key) || null);
      }),
    });
  } catch (error) {
    next(error);
  }
};

// 주문 ID로 주문 상세, 주문 상품, 배송지를 함께 조회합니다.
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (!canAccessOrder(req, order)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this order',
      });
    }

    const { items, shippingAddress } = await getOrderRelations(order._id);

    res.json({
      success: true,
      order: formatOrder(order, items, shippingAddress),
    });
  } catch (error) {
    next(error);
  }
};

// 로그인 사용자가 주문을 생성합니다. 결제 ID가 있으면 중복 주문 확인과 포트원 결제 검증을 수행합니다.
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentId } = req.body;
    const shippingFee = Number(req.body.shippingFee || 0);
    const discountAmount = Number(req.body.discountAmount || 0);

    // 같은 결제 건으로 이미 생성된 주문이 있는지 확인합니다. (중복 주문 방지)
    if (paymentId) {
      const existingOrder = await Order.findOne({ paymentId });

      if (existingOrder) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_ORDER',
          message: 'An order for this payment already exists',
          order: formatOrder(existingOrder),
        });
      }
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isDeleted: { $ne: true } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const quantity = Number(item.quantity);

      if (!product) {
        const error = new Error('Product not found');
        error.status = 404;
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
      }

      if (product.stock < quantity) {
        const error = new Error('Requested quantity exceeds product stock');
        error.status = 400;
        error.code = 'OUT_OF_STOCK';
        throw error;
      }

      return {
        product,
        quantity,
        lineTotal: product.price * quantity,
      };
    });
    const productTotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalAmount = Math.max(productTotal + shippingFee - discountAmount, 0);
    const orderPayload = {
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      totalAmount,
      shippingFee,
      discountAmount,
      paymentMethod,
    };

    // 결제 ID가 있으면 포트원 API로 결제 상태와 금액을 검증합니다.
    if (paymentId) {
      let verification;

      try {
        verification = await verifyPayment(paymentId, totalAmount);
      } catch (verifyError) {
        return res.status(502).json({
          success: false,
          code: 'PAYMENT_VERIFICATION_ERROR',
          message: `Failed to verify payment: ${verifyError.message}`,
        });
      }

      // 결제 미완료 또는 금액 불일치 시 주문을 생성하지 않습니다.
      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: verification.reason,
        });
      }

      // 검증 통과: 결제 완료 상태로 주문을 생성하고 포트원의 결제 일시를 기록합니다.
      orderPayload.paymentId = paymentId;
      orderPayload.paymentStatus = 'PAID';
      orderPayload.status = 'PAID';
      orderPayload.paidAt = verification.payment.paidAt
        ? new Date(verification.payment.paidAt)
        : new Date();
    }

    const order = await Order.create(orderPayload);
    const createdItems = await OrderItem.insertMany(
      orderItems.map(({ product, quantity, lineTotal }) => ({
        order: order._id,
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        currency: product.currency || 'KRW',
        quantity,
        lineTotal,
      }))
    );
    const createdShippingAddress = await ShippingAddress.create({
      order: order._id,
      recipientName: shippingAddress.recipientName,
      recipientPhone: shippingAddress.recipientPhone,
      zipCode: shippingAddress.zipCode,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      deliveryMemo: shippingAddress.deliveryMemo,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: formatOrder(order, createdItems, createdShippingAddress),
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    next(error);
  }
};

// 관리자가 주문 상태와 결제 상태를 수정합니다.
const updateOrder = async (req, res, next) => {
  try {
    const allowedFields = ['status', 'paymentStatus', 'paymentMethod', 'paidAt'];
    const update = allowedFields.reduce((payload, field) => {
      if (req.body[field] !== undefined) {
        payload[field] = field === 'paidAt' ? new Date(req.body[field]) : req.body[field];
      }

      return payload;
    }, {});
    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    const { items, shippingAddress } = await getOrderRelations(order._id);

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: formatOrder(order, items, shippingAddress),
    });
  } catch (error) {
    next(error);
  }
};

// 관리자가 주문과 주문 관련 하위 데이터를 삭제합니다.
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    await Promise.all([
      OrderItem.deleteMany({ order: order._id }),
      ShippingAddress.deleteOne({ order: order._id }),
    ]);

    res.json({
      success: true,
      message: 'Order deleted successfully',
      order: formatOrder(order),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
};
