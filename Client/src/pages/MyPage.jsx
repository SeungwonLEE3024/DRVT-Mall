import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchMe, fetchOrders, updateProfile } from '../services/api'
import './MyPage.css'

const ORDER_PAGE_LIMIT = 5

// 주문 상태를 한글로 변환합니다.
const ORDER_STATUS_LABELS = {
  PENDING: '주문 접수',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
}

const PAYMENT_STATUS_LABELS = {
  PENDING: '결제 대기',
  PAID: '결제 완료',
  FAILED: '결제 실패',
  CANCELLED: '결제 취소',
  REFUNDED: '환불 완료',
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}원`
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function MyPage() {
  const navigate = useNavigate()
  const { isAuthenticated, token, user, updateUser } = useAuth()

  // 기본 정보 폼 상태
  const [form, setForm] = useState({
    name: '',
    phone: '',
    marketingOptIn: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  // 내 주소 상태
  const [addresses, setAddresses] = useState([])
  const [addressForm, setAddressForm] = useState({
    label: '',
    zipCode: '',
    address1: '',
    address2: '',
  })
  const [isAddressSaving, setIsAddressSaving] = useState(false)
  const [addressMessage, setAddressMessage] = useState('')
  const [addressError, setAddressError] = useState('')

  // 주문 내역 상태
  const [orders, setOrders] = useState([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPagination, setOrdersPagination] = useState({
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  })
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  // 서버에서 최신 프로필을 불러와 폼 초기값으로 설정합니다.
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return

      try {
        const data = await fetchMe(token)
        const me = data.user

        setForm({
          name: me?.name || '',
          phone: me?.phone || '',
          marketingOptIn: Boolean(me?.marketingOptIn),
        })
        setAddresses(me?.addresses || [])
      } catch {
        // 서버 조회 실패 시 로컬에 저장된 유저 정보로 대체합니다.
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          marketingOptIn: Boolean(user?.marketingOptIn),
        })
        setAddresses(user?.addresses || [])
      }
    }

    loadProfile()
    // 마운트 시 1회만 로드합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // 주문 내역을 불러옵니다.
  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return

      setIsOrdersLoading(true)
      setOrdersError('')

      try {
        const data = await fetchOrders(token, { page: ordersPage, limit: ORDER_PAGE_LIMIT })
        setOrders(data.orders || [])
        setOrdersPagination({
          totalPages: data.totalPages || 1,
          hasNextPage: Boolean(data.hasNextPage),
          hasPrevPage: Boolean(data.hasPrevPage),
          total: data.total || 0,
        })
      } catch (loadError) {
        setOrdersError(loadError?.message || '주문 내역을 불러오지 못했습니다.')
      } finally {
        setIsOrdersLoading(false)
      }
    }

    loadOrders()
  }, [token, ordersPage])

  const handleFormChange = useCallback((event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }, [])

  // 기본 정보 저장 핸들러
  const handleProfileSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setProfileMessage('')
      setProfileError('')

      if (!form.name.trim()) {
        setProfileError('이름을 입력해주세요.')
        return
      }

      setIsSaving(true)

      try {
        const payload = {
          name: form.name.trim(),
          marketingOptIn: form.marketingOptIn,
        }

        if (form.phone.trim()) {
          payload.phone = form.phone.trim()
        }

        const data = await updateProfile(token, payload)

        // 컨텍스트와 로컬 스토리지의 유저 정보를 갱신합니다.
        updateUser({ ...user, ...data.user })
        setProfileMessage('기본 정보가 저장되었습니다.')
      } catch (saveError) {
        setProfileError(saveError?.message || '기본 정보 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [form, token, user, updateUser]
  )

  const handleAddressFormChange = useCallback((event) => {
    const { name, value } = event.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  // 주소 목록을 서버에 저장하고 상태를 동기화합니다.
  const saveAddresses = useCallback(
    async (nextAddresses, successMessage) => {
      setAddressMessage('')
      setAddressError('')
      setIsAddressSaving(true)

      try {
        const data = await updateProfile(token, { addresses: nextAddresses })
        setAddresses(data.user?.addresses || nextAddresses)
        updateUser({ ...user, ...data.user })
        setAddressMessage(successMessage)
      } catch (saveError) {
        setAddressError(saveError?.message || '주소 저장에 실패했습니다.')
      } finally {
        setIsAddressSaving(false)
      }
    },
    [token, user, updateUser]
  )

  // 새 주소 추가 핸들러
  const handleAddressSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (!addressForm.zipCode.trim()) {
        setAddressError('우편번호를 입력해주세요.')
        return
      }

      if (!addressForm.address1.trim()) {
        setAddressError('주소를 입력해주세요.')
        return
      }

      const nextAddresses = [
        ...addresses,
        {
          label: addressForm.label.trim() || '배송지',
          zipCode: addressForm.zipCode.trim(),
          address1: addressForm.address1.trim(),
          address2: addressForm.address2.trim(),
          isDefault: addresses.length === 0,
        },
      ]

      await saveAddresses(nextAddresses, '주소가 추가되었습니다.')
      setAddressForm({ label: '', zipCode: '', address1: '', address2: '' })
    },
    [addressForm, addresses, saveAddresses]
  )

  // 주소 삭제 핸들러
  const handleAddressDelete = useCallback(
    (index) => {
      const nextAddresses = addresses.filter((_, i) => i !== index)

      // 기본 배송지를 삭제하면 첫 번째 주소를 기본으로 지정합니다.
      if (nextAddresses.length > 0 && !nextAddresses.some((addr) => addr.isDefault)) {
        nextAddresses[0] = { ...nextAddresses[0], isDefault: true }
      }

      saveAddresses(nextAddresses, '주소가 삭제되었습니다.')
    },
    [addresses, saveAddresses]
  )

  // 기본 배송지 설정 핸들러
  const handleAddressSetDefault = useCallback(
    (index) => {
      const nextAddresses = addresses.map((addr, i) => ({ ...addr, isDefault: i === index }))

      saveAddresses(nextAddresses, '기본 배송지가 변경되었습니다.')
    },
    [addresses, saveAddresses]
  )

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <main className="mypage">
      <header className="mypage-topbar">
        <button type="button" onClick={() => navigate('/')} aria-label="메인으로 돌아가기">
          ←
        </button>
        <strong>마이페이지</strong>
        <span />
      </header>

      <section className="mypage-container">
        <div className="mypage-layout">
          <section className="mypage-card mypage-profile">
            <h1>기본 정보</h1>
            <p className="mypage-email">{user?.email}</p>

            <form className="mypage-form" onSubmit={handleProfileSubmit}>
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
                연락처
                <input
                  name="phone"
                  placeholder="010-1234-5678"
                  value={form.phone}
                  onChange={handleFormChange}
                />
              </label>

              <label className="mypage-checkbox">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={form.marketingOptIn}
                  onChange={handleFormChange}
                />
                마케팅 정보 수신에 동의합니다
              </label>

              {profileMessage && <p className="mypage-message success">{profileMessage}</p>}
              {profileError && <p className="mypage-message error">{profileError}</p>}

              <button type="submit" className="mypage-save" disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </form>
          </section>

          <section className="mypage-card mypage-addresses">
            <h1>내 주소 {addresses.length > 0 && <em>({addresses.length}개)</em>}</h1>

            {addresses.length === 0 ? (
              <p className="mypage-state">저장된 주소가 없습니다.</p>
            ) : (
              <ul className="mypage-address-list">
                {addresses.map((address, index) => (
                  <li className="mypage-address" key={`${address.zipCode}-${address.address1}-${index}`}>
                    <div className="mypage-address-info">
                      <div className="mypage-address-head">
                        <strong>{address.label || '배송지'}</strong>
                        {address.isDefault && <span className="mypage-address-default">기본</span>}
                      </div>
                      <p>
                        ({address.zipCode}) {address.address1}
                        {address.address2 ? ` ${address.address2}` : ''}
                      </p>
                    </div>
                    <div className="mypage-address-actions">
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleAddressSetDefault(index)}
                          disabled={isAddressSaving}
                        >
                          기본 설정
                        </button>
                      )}
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleAddressDelete(index)}
                        disabled={isAddressSaving}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="mypage-form mypage-address-form" onSubmit={handleAddressSubmit}>
              <h2>새 주소 추가</h2>

              <label>
                배송지명
                <input
                  name="label"
                  placeholder="집, 회사 등"
                  value={addressForm.label}
                  onChange={handleAddressFormChange}
                />
              </label>

              <label>
                우편번호
                <input
                  name="zipCode"
                  placeholder="06234"
                  value={addressForm.zipCode}
                  onChange={handleAddressFormChange}
                />
              </label>

              <label>
                주소
                <input
                  name="address1"
                  placeholder="서울특별시 강남구 테헤란로"
                  value={addressForm.address1}
                  onChange={handleAddressFormChange}
                />
              </label>

              <label>
                상세 주소
                <input
                  name="address2"
                  placeholder="101동 1001호"
                  value={addressForm.address2}
                  onChange={handleAddressFormChange}
                />
              </label>

              {addressMessage && <p className="mypage-message success">{addressMessage}</p>}
              {addressError && <p className="mypage-message error">{addressError}</p>}

              <button type="submit" className="mypage-save" disabled={isAddressSaving}>
                {isAddressSaving ? '저장 중...' : '주소 추가하기'}
              </button>
            </form>
          </section>

          <section className="mypage-card mypage-orders">
            <h1>주문 내역 {ordersPagination.total > 0 && <em>({ordersPagination.total}건)</em>}</h1>

            {isOrdersLoading && <p className="mypage-state">주문 내역을 불러오는 중입니다.</p>}
            {ordersError && <p className="mypage-state error">{ordersError}</p>}

            {!isOrdersLoading && !ordersError && (
              <>
                {orders.length === 0 ? (
                  <div className="mypage-orders-empty">
                    <p>주문 내역이 없습니다.</p>
                    <button type="button" onClick={() => navigate('/')}>
                      상품 보러가기
                    </button>
                  </div>
                ) : (
                  <ul className="mypage-order-list">
                    {orders.map((order) => (
                      <li className="mypage-order" key={order.id}>
                        <div className="mypage-order-head">
                          <div>
                            <strong>{order.orderNumber}</strong>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <span
                            className={`mypage-order-status status-${String(order.status || '').toLowerCase()}`}
                          >
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>

                        {order.items?.length > 0 && (
                          <div className="mypage-order-items">
                            {order.items.map((item) => (
                              <div className="mypage-order-item" key={item.id}>
                                <div className="mypage-order-thumb">
                                  {item.product?.image ? (
                                    <img src={item.product.image} alt={item.productName} />
                                  ) : (
                                    <span aria-hidden="true">▣</span>
                                  )}
                                </div>
                                <div className="mypage-order-item-info">
                                  <strong>{item.productName}</strong>
                                  <span>
                                    {formatPrice(item.unitPrice)} × {item.quantity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {order.shippingAddress && (
                          <div className="mypage-order-shipping">
                            <span>배송지</span>
                            <p>
                              <strong>{order.shippingAddress.recipientName}</strong>
                              {order.shippingAddress.recipientPhone && (
                                <em> · {order.shippingAddress.recipientPhone}</em>
                              )}
                            </p>
                            <p>
                              ({order.shippingAddress.zipCode}) {order.shippingAddress.address1}
                              {order.shippingAddress.address2
                                ? ` ${order.shippingAddress.address2}`
                                : ''}
                            </p>
                          </div>
                        )}

                        <div className="mypage-order-body">
                          <div>
                            <span>결제 상태</span>
                            <strong>
                              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                            </strong>
                          </div>
                          <div>
                            <span>결제 금액</span>
                            <strong>{formatPrice(order.totalAmount)}</strong>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {ordersPagination.totalPages > 1 && (
                  <nav className="mypage-orders-pagination" aria-label="주문 내역 페이지네이션">
                    <button
                      type="button"
                      onClick={() => setOrdersPage((page) => Math.max(page - 1, 1))}
                      disabled={!ordersPagination.hasPrevPage}
                    >
                      ← 이전
                    </button>
                    <span>
                      {ordersPage} / {ordersPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOrdersPage((page) => Math.min(page + 1, ordersPagination.totalPages))
                      }
                      disabled={!ordersPagination.hasNextPage}
                    >
                      다음 →
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default MyPage
