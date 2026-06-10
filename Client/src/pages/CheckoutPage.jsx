import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { clearCart, createOrder, fetchCart, fetchMe, updateProfile } from '../services/api'
import './CheckoutPage.css'

// 포트원 V2 연동 정보 (콘솔 > 결제 연동 > 연동 정보에서 확인)
const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || ''
const PORTONE_CHANNEL_KEY = 'channel-key-2b2fe197-d10b-4d38-a60d-2b64d147ee8f'

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}원`
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { isAuthenticated, token, user, updateUser } = useAuth()
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const sdkReadyRef = useRef(false)

  // 배송 정보 폼 상태
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    memo: '',
  })

  // 포트원 V2 브라우저 SDK 로드
  useEffect(() => {
    if (sdkReadyRef.current || window.PortOne) {
      sdkReadyRef.current = true
      return
    }

    const scriptId = 'portone-v2-sdk'
    if (document.getElementById(scriptId)) return

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    script.onload = () => {
      sdkReadyRef.current = true
    }
    document.head.appendChild(script)
  }, [])

  // 서버의 최신 프로필로 폼 초기값을 설정합니다. (기본 배송지 포함)
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return

      let me = user

      try {
        const data = await fetchMe(token)
        me = { ...user, ...data.user }
        // 저장된 주소 비교 로직이 최신 주소 목록을 사용하도록 동기화합니다.
        updateUser(me)
      } catch {
        // 서버 조회 실패 시 로컬에 저장된 유저 정보를 사용합니다.
      }

      // 기본 배송지(없으면 첫 번째 주소)를 미리 채웁니다.
      const savedAddresses = me?.addresses || []
      const defaultAddress = savedAddresses.find((addr) => addr.isDefault) || savedAddresses[0]

      setForm((prev) => ({
        ...prev,
        name: me?.name || '',
        email: me?.email || '',
        phone: me?.phone || '',
        address: defaultAddress
          ? `${defaultAddress.address1}${defaultAddress.address2 ? ` ${defaultAddress.address2}` : ''}`
          : prev.address,
        zipCode: defaultAddress?.zipCode || prev.zipCode,
      }))
    }

    loadProfile()
    // 마운트 시 1회만 로드합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const loadCart = async () => {
      if (!token) return

      try {
        const data = await fetchCart(token)
        setCart(data.cart)
      } catch (loadError) {
        setError(loadError?.message || '주문 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [token])

  const shippingFee = 0
  const orderTotal = (cart?.totalPrice || 0) + shippingFee

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  // 결제 요청 핸들러 (포트원 V2)
  const handlePayment = useCallback(async () => {
    if (!form.name.trim()) { alert('이름을 입력해주세요.'); return }
    if (!form.email.trim()) { alert('이메일을 입력해주세요.'); return }
    if (!form.phone.trim()) { alert('연락처를 입력해주세요.'); return }
    if (!form.address.trim()) { alert('주소를 입력해주세요.'); return }
    if (!form.zipCode.trim()) { alert('우편번호를 입력해주세요.'); return }

    if (!window.PortOne) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (!PORTONE_STORE_ID) {
      alert('포트원 상점 ID(VITE_PORTONE_STORE_ID)가 설정되지 않았습니다.')
      return
    }

    // 저장된 연락처와 입력한 연락처가 다르면 내 정보 업데이트 여부를 묻습니다.
    const enteredPhone = form.phone.trim()
    let currentUser = user

    if (enteredPhone !== (user?.phone || '')) {
      const shouldSavePhone = window.confirm('내 정보를 이 연락처로 저장할까요?')

      if (shouldSavePhone) {
        try {
          const data = await updateProfile(token, { phone: enteredPhone })
          currentUser = { ...user, ...data.user }
          updateUser(currentUser)
        } catch (profileError) {
          alert(`연락처 저장에 실패했습니다.\n(${profileError?.message || ''})\n결제는 계속 진행됩니다.`)
        }
      }
    }

    // 주문자 이름이 내 정보와 같고, 입력한 주소가 저장된 주소에 없으면 새 주소 등록 여부를 묻습니다.
    const enteredZipCode = form.zipCode.trim()
    const enteredAddress1 = form.address.trim()

    if (form.name.trim() === (currentUser?.name || '')) {
      const savedAddresses = currentUser?.addresses || []
      const alreadySaved = savedAddresses.some((addr) => {
        const combined = `${addr.address1}${addr.address2 ? ` ${addr.address2}` : ''}`

        return (
          addr.zipCode === enteredZipCode &&
          (addr.address1 === enteredAddress1 || combined === enteredAddress1)
        )
      })

      if (!alreadySaved) {
        const shouldSaveAddress = window.confirm('새로운 주소로 등록할까요?')

        if (shouldSaveAddress) {
          try {
            const nextAddresses = [
              ...savedAddresses.map((addr) => ({
                label: addr.label,
                zipCode: addr.zipCode,
                address1: addr.address1,
                address2: addr.address2,
                isDefault: addr.isDefault,
              })),
              {
                label: '배송지',
                zipCode: enteredZipCode,
                address1: enteredAddress1,
                isDefault: savedAddresses.length === 0,
              },
            ]
            const data = await updateProfile(token, { addresses: nextAddresses })
            currentUser = { ...currentUser, ...data.user }
            updateUser(currentUser)
          } catch (addressError) {
            alert(`주소 저장에 실패했습니다.\n(${addressError?.message || ''})\n결제는 계속 진행됩니다.`)
          }
        }
      }
    }

    setIsPaying(true)

    // 결제 고유번호: 서버 결제 검증과 중복 주문 방지에 사용됩니다.
    const paymentId = `order_${Date.now()}`

    try {
      const response = await window.PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId,
        orderName: cart.items.map((i) => i.product?.name).join(', '),
        totalAmount: orderTotal,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: {
          fullName: form.name,
          email: form.email,
          phoneNumber: form.phone,
        },
      })

      // V2 SDK는 실패 시 response.code 가 존재함
      if (response.code !== undefined) {
        alert(`결제에 실패했습니다.\n사유: ${response.message}`)
        return
      }

      // 결제 성공 → 주문 생성 (서버가 paymentId로 포트원 결제를 검증한 후 주문을 저장합니다)
      try {
        await createOrder(token, {
          items: cart.items.map((item) => ({
            productId: item.product?.id,
            quantity: item.quantity,
          })),
          shippingAddress: {
            recipientName: form.name.trim(),
            recipientPhone: form.phone.trim(),
            zipCode: form.zipCode.trim(),
            address1: form.address.trim(),
            deliveryMemo: form.memo.trim() || undefined,
          },
          paymentMethod: 'CARD',
          shippingFee,
          paymentId,
        })
      } catch (orderError) {
        alert(
          `결제는 완료되었지만 주문 저장에 실패했습니다.\n고객센터에 문의해주세요.\n(${orderError?.message || ''})`
        )
        return
      }

      // 주문 생성 완료 → 장바구니 비우기
      try {
        await clearCart(token)
        window.dispatchEvent(new Event('cart:updated'))
      } catch {
        // 장바구니 비우기 실패는 결제 완료 흐름을 막지 않음
      }

      alert(`결제가 완료되었습니다.\n결제 번호: ${response.paymentId}`)
      navigate('/mypage')
    } catch (payError) {
      alert(`결제 중 오류가 발생했습니다.\n${payError?.message || ''}`)
    } finally {
      setIsPaying(false)
    }
  }, [form, cart, orderTotal, token, user, updateUser, navigate])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <button type="button" onClick={() => navigate('/cart')} aria-label="장바구니로 돌아가기">
          ←
        </button>
        <strong>주문하기</strong>
        <span />
      </header>

      <section className="checkout-container">
        <div className="checkout-steps" aria-label="주문 단계">
          <div className="active">
            <span>1</span>
            배송
          </div>
          <div>
            <span>2</span>
            결제
          </div>
          <div>
            <span>3</span>
            확인
          </div>
        </div>

        {isLoading && <p className="checkout-state">주문 정보를 불러오는 중입니다.</p>}
        {error && <p className="checkout-state error">{error}</p>}

        {!isLoading && !error && (
          <>
            {!cart?.items?.length ? (
              <div className="checkout-empty">
                <p>주문할 상품이 없습니다.</p>
                <Link to="/">상품 보러가기</Link>
              </div>
            ) : (
              <div className="checkout-layout">
                <section className="checkout-card checkout-shipping">
                  <h1>
                    <span aria-hidden="true">▣</span>
                    배송 정보
                  </h1>

                  <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
                    <label>
                      이름
                      <input
                        name="name"
                        placeholder="홍길동"
                        value={form.name}
                        onChange={handleFormChange}
                      />
                    </label>

                    <label>
                      이메일
                      <input
                        type="email"
                        name="email"
                        placeholder="user@example.com"
                        value={form.email}
                        onChange={handleFormChange}
                      />
                    </label>

                    <label>
                      연락처
                      <input
                        name="phone"
                        placeholder="010-1234-5678"
                        value={form.phone}
                        onChange={handleFormChange}
                      />
                    </label>

                    <label>
                      주소
                      <input
                        name="address"
                        placeholder="서울특별시 강남구 테헤란로"
                        value={form.address}
                        onChange={handleFormChange}
                      />
                    </label>

                    <label>
                      우편번호
                      <input
                        name="zipCode"
                        placeholder="06234"
                        value={form.zipCode}
                        onChange={handleFormChange}
                      />
                    </label>

                    <label>
                      배송 메모
                      <textarea
                        name="memo"
                        placeholder="배송 요청사항을 입력해주세요."
                        rows="4"
                        value={form.memo}
                        onChange={handleFormChange}
                      />
                    </label>
                  </form>
                </section>

                <aside className="checkout-card checkout-summary">
                  <h2>주문 요약</h2>
                  <div className="checkout-summary-items">
                    {cart.items.map((item, index) => (
                      <article className="checkout-summary-item" key={item.id}>
                        <div className="checkout-summary-thumb">
                          {item.product?.image && <img src={item.product.image} alt={item.product.name} />}
                          <span>{index + 1}</span>
                        </div>
                        <div>
                          <strong>{item.product?.name}</strong>
                          <p>{item.product?.category}</p>
                          <em>
                            {formatPrice(item.product?.price)} × {item.quantity}
                          </em>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="checkout-price-lines">
                    <div>
                      <span>상품금액 ({cart.totalQuantity}개)</span>
                      <strong>{formatPrice(cart.totalPrice)}</strong>
                    </div>
                    <div>
                      <span>배송비</span>
                      <strong>무료</strong>
                    </div>
                  </div>

                  <div className="checkout-total">
                    <span>총 결제금액</span>
                    <strong>{formatPrice(orderTotal)}</strong>
                  </div>

                  <button
                    type="button"
                    className="checkout-place-order"
                    onClick={handlePayment}
                    disabled={isPaying}
                  >
                    {isPaying ? '결제 처리 중...' : '주문하기'}
                  </button>

                  <p className="checkout-secure">안전한 SSL 암호화 결제</p>
                  <div className="checkout-payment-tags">
                    <span>VISA</span>
                    <span>MC</span>
                    <span>AMEX</span>
                    <span>PAYPAL</span>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default CheckoutPage
