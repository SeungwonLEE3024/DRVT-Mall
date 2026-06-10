import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchCart, removeCartItem, updateCartItem } from '../services/api'
import './CartPage.css'

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}원`
}

function CartPage() {
  const { isAuthenticated, token } = useAuth()
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingProductId, setUpdatingProductId] = useState('')
  const [removingProductId, setRemovingProductId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCart = async () => {
      if (!token) return

      try {
        const data = await fetchCart(token)
        setCart(data.cart)
      } catch (loadError) {
        setError(loadError?.message || '장바구니를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [token])

  const handleQuantityChange = async (item, nextQuantity) => {
    if (!token || nextQuantity < 1) {
      return
    }

    if (item.product?.stock < nextQuantity) {
      setError('선택한 수량이 재고보다 많습니다.')
      return
    }

    setError('')
    setUpdatingProductId(item.product.id)

    try {
      const data = await updateCartItem(token, item.product.id, nextQuantity)
      setCart(data.cart)
      window.dispatchEvent(new Event('cart:updated'))
    } catch (updateError) {
      setError(updateError?.message || '수량을 변경하지 못했습니다.')
    } finally {
      setUpdatingProductId('')
    }
  }

  const handleRemoveItem = async (item) => {
    if (!token) {
      return
    }

    setError('')
    setRemovingProductId(item.product.id)

    try {
      const data = await removeCartItem(token, item.product.id)
      setCart(data.cart)
      window.dispatchEvent(new Event('cart:updated'))
    } catch (removeError) {
      setError(removeError?.message || '상품을 삭제하지 못했습니다.')
    } finally {
      setRemovingProductId('')
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <main className="cart-page">
      <section className="cart-container">
        <div className="cart-heading">
          <h1>장바구니</h1>
          <Link to="/">쇼핑 계속하기</Link>
        </div>

        {isLoading && <p className="cart-state">장바구니를 불러오는 중입니다.</p>}
        {error && <p className="cart-state error">{error}</p>}

        {!isLoading && !error && (
          <>
            {!cart?.items?.length ? (
              <div className="cart-empty">
                <p>장바구니에 담긴 상품이 없습니다.</p>
                <Link to="/">상품 보러가기</Link>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.items.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-image">
                        {item.product?.image && <img src={item.product.image} alt={item.product.name} />}
                      </div>
                      <div className="cart-item-info">
                        <strong>{item.product?.name}</strong>
                        <span>{item.product?.category}</span>
                        <div className="cart-item-quantity">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={updatingProductId === item.product?.id || item.quantity <= 1}
                          >
                            -
                          </button>
                          <strong>{item.quantity}</strong>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={updatingProductId === item.product?.id || item.quantity >= item.product?.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-price">
                        <strong>{formatPrice(item.subtotal)}</strong>
                        <span>{formatPrice(item.product?.price)}</span>
                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => handleRemoveItem(item)}
                          disabled={removingProductId === item.product?.id}
                        >
                          {removingProductId === item.product?.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="cart-summary">
                  <h2>주문 요약</h2>
                  <div>
                    <span>총 수량</span>
                    <strong>{cart.totalQuantity}개</strong>
                  </div>
                  <div>
                    <span>상품 금액</span>
                    <strong>{formatPrice(cart.totalPrice)}</strong>
                  </div>
                  <Link to="/checkout" className="cart-checkout-link">
                    주문하기
                  </Link>
                </aside>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default CartPage
