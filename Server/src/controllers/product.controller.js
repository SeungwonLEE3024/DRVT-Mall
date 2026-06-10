const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

// MongoDB unique index 충돌 시 발생하는 오류 코드
const DUPLICATE_KEY_CODE = 11000;
// 상품 목록 페이지네이션 기본값
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 2;

// 클라이언트 응답에 사용할 상품 데이터 형태를 통일합니다.
const formatProduct = (product) => ({
  id: product._id,
  sku: product.sku,
  name: product.name,
  price: product.price,
  originalPrice: product.originalPrice,
  currency: product.currency,
  stock: product.stock,
  category: product.category,
  image: product.image,
  images: product.images,
  description: product.description,
  isDeleted: Boolean(product.isDeleted),
  deletedAt: product.deletedAt,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

// MongoDB unique index 충돌(SKU 중복)을 일관된 409 응답으로 변환합니다.
const handleDuplicateSku = (error, res) => {
  if (error?.code !== DUPLICATE_KEY_CODE) {
    return false;
  }

  res.status(409).json({
    success: false,
    code: 'DUPLICATE_SKU',
    message: 'SKU already exists',
  });

  return true;
};

const getPaginatedProducts = async (req, res, filter = {}) => {
  const page = Math.max(parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    count: products.length,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    products: products.map(formatProduct),
  });
};

// 상품 목록을 최신순으로 조회합니다. 공개 목록에서는 삭제 처리된 상품을 제외합니다.
const getProducts = async (req, res, next) => {
  try {
    await getPaginatedProducts(req, res, { isDeleted: { $ne: true } });
  } catch (error) {
    next(error);
  }
};

// 관리자 상품 목록은 삭제 처리된 상품까지 포함해 조회합니다.
const getAdminProducts = async (req, res, next) => {
  try {
    await getPaginatedProducts(req, res);
  } catch (error) {
    next(error);
  }
};

// 상품 상세 정보를 ID로 조회합니다.
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!product) {
      return res.status(404).json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

// 어드민이 새 상품을 등록합니다.
const createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      price,
      originalPrice,
      currency = 'KRW',
      stock,
      category,
      image,
      images = [],
      description,
    } = req.body;

    const product = await Product.create({
      sku,
      name,
      price,
      originalPrice,
      currency,
      stock,
      category,
      image,
      images,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: formatProduct(product),
    });
  } catch (error) {
    if (handleDuplicateSku(error, res)) return;
    next(error);
  }
};

// 어드민이 기존 상품 정보를 수정합니다.
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: formatProduct(product),
    });
  } catch (error) {
    if (handleDuplicateSku(error, res)) return;
    next(error);
  }
};

// 어드민이 상품을 삭제합니다. 주문 이력이 있으면 소프트 삭제하고, 없으면 실제 삭제합니다.
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    }

    if (product.isDeleted) {
      return res.json({
        success: true,
        deletionType: 'soft',
        message: 'Product is already hidden from customers',
        product: formatProduct(product),
      });
    }

    const hasOrderItems = await OrderItem.exists({ product: product._id });

    if (hasOrderItems) {
      product.isDeleted = true;
      product.deletedAt = new Date();
      product.stock = 0;
      await product.save();

      return res.json({
        success: true,
        deletionType: 'soft',
        message: 'Product has order history and was hidden from customers',
        product: formatProduct(product),
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      deletionType: 'hard',
      message: 'Product deleted successfully',
      product: formatProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
