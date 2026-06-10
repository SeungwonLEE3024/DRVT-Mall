import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MainFooter from '../components/home/MainFooter'
import { useAuth } from '../hooks/useAuth'
import { addCartItem, fetchProduct } from '../services/api'
import './ProductDetailPage.css'

function formatPrice(value) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return `${Number(value).toLocaleString()}원`
}

function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCart, setIsAddingCart] = useState(false)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProduct(productId)
        setProduct(data.product)
        setSelectedImage(data.product?.image || data.product?.images?.[0] || '')
      } catch (loadError) {
        setError(loadError?.message || '상품 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const galleryImages = useMemo(() => {
    if (!product) return []

    return [product.image, ...(product.images || [])].filter(Boolean).filter((image, index, images) => images.indexOf(image) === index)
  }, [product])

  const totalPrice = product ? product.price * quantity : 0

  const handleAddToCart = async () => {
    setError('')
    setCartMessage('')

    if (!isAuthenticated || !token) {
      navigate('/auth')
      return
    }

    if (product.stock < quantity) {
      setError('선택한 수량이 재고보다 많습니다.')
      return
    }

    setIsAddingCart(true)

    try {
      await addCartItem(token, product.id, quantity)
      setCartMessage(`${quantity}개가 장바구니에 담겼습니다.`)
      window.dispatchEvent(new Event('cart:updated'))
    } catch (addError) {
      setError(addError?.message || '장바구니에 상품을 담지 못했습니다.')
    } finally {
      setIsAddingCart(false)
    }
  }

  if (isLoading) {
    return <p className="product-detail-state">상품 정보를 불러오는 중입니다.</p>
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <p className="product-detail-state error">{error || '상품을 찾을 수 없습니다.'}</p>
      </main>
    )
  }

  return (
    <main className="product-detail-page">
      <section className="product-detail-hero">
        <div className="product-detail-gallery">
          <div className="product-detail-main-image">
            {selectedImage ? <img src={selectedImage} alt={product.name} /> : <span>이미지 없음</span>}
          </div>
          {galleryImages.length > 1 && (
            <div className="product-detail-thumbs">
              {galleryImages.map((image) => (
                <button
                  type="button"
                  className={image === selectedImage ? 'active' : ''}
                  key={image}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`${product.name} 썸네일`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="product-detail-summary">
          <p className="product-detail-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-sku">SKU {product.sku}</p>

          <div className="product-detail-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice ? <del>{formatPrice(product.originalPrice)}</del> : null}
          </div>

          <dl className="product-detail-meta">
            <div>
              <dt>배송</dt>
              <dd>무료배송 / 2-3일 이내 출고</dd>
            </div>
            <div>
              <dt>재고</dt>
              <dd>{product.stock > 0 ? `${product.stock}개 남음` : '품절'}</dd>
            </div>
            <div>
              <dt>혜택</dt>
              <dd>회원 구매 시 적립금 지급</dd>
            </div>
          </dl>

          <div className="product-detail-quantity">
            <span>수량</span>
            <div>
              <button type="button" onClick={() => setQuantity((current) => Math.max(current - 1, 1))}>
                -
              </button>
              <strong>{quantity}</strong>
              <button type="button" onClick={() => setQuantity((current) => Math.min(current + 1, product.stock))}>
                +
              </button>
            </div>
          </div>

          <div className="product-detail-total">
            <span>총 상품금액</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <div className="product-detail-actions">
            <button type="button" className="product-detail-buy">
              바로 구매하기
            </button>
            <button
              type="button"
              className="product-detail-cart"
              onClick={handleAddToCart}
              disabled={isAddingCart || product.stock <= 0}
            >
              {isAddingCart ? '담는 중...' : '장바구니'}
            </button>
          </div>
          {(cartMessage || error) && (
            <p className={`product-detail-cart-message ${error ? 'error' : 'success'}`}>
              {error || cartMessage}
            </p>
          )}
        </aside>
      </section>

      <nav className="product-detail-tabs">
        <a href="#detail-info">상세정보</a>
        <a href="#notice-info">상품고시</a>
        <a href="#reviews">리뷰</a>
        <a href="#qna">문의</a>
      </nav>

      <section id="detail-info" className="product-detail-content">
        <span className="product-detail-eyebrow">DRVT PRODUCT</span>
        <h2>{product.name}</h2>
        <p className="product-detail-lead">
          매일의 루틴을 더 편하게 이어갈 수 있도록 구성한 DRVT Mall 추천 상품입니다.
        </p>

        {product.description ? (
          <div className="product-detail-description" dangerouslySetInnerHTML={{ __html: product.description }} />
        ) : (
          <p className="product-detail-description-empty">등록된 상세 설명이 없습니다.</p>
        )}

        <div className="product-detail-red-panel">
          <strong>데일리케어 루틴을 위한 선택</strong>
          <p>상품 상세 정보와 이미지, 영양 및 사용 안내를 확인한 후 구매해 주세요.</p>
        </div>

        {galleryImages.length > 0 && (
          <div className="product-detail-wide-images">
            {galleryImages.map((image) => (
              <img src={image} alt={`${product.name} 상세 이미지`} key={image} />
            ))}
          </div>
        )}
      </section>

      <section id="notice-info" className="product-detail-notice">
        <h2>상품 고시 정보</h2>
        <table>
          <tbody>
            <tr>
              <th>상품명</th>
              <td>{product.name}</td>
            </tr>
            <tr>
              <th>카테고리</th>
              <td>{product.category}</td>
            </tr>
            <tr>
              <th>판매가</th>
              <td>{formatPrice(product.price)}</td>
            </tr>
            <tr>
              <th>재고</th>
              <td>{product.stock}개</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="reviews" className="product-detail-board">
        <div>
          <h2>리뷰</h2>
          <p>등록된 리뷰가 없습니다.</p>
        </div>
        <Link to="/">목록으로 돌아가기</Link>
      </section>

      <section id="qna" className="product-detail-board">
        <div>
          <h2>상품 문의</h2>
          <p>상품 문의는 고객센터를 통해 남겨주세요.</p>
        </div>
      </section>

      <MainFooter />
    </main>
  )
}

export default ProductDetailPage
