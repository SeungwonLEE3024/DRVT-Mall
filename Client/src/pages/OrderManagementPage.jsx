import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '../components/admin/AdminHeader'
import { useAuth } from '../hooks/useAuth'
import { fetchOrders } from '../services/api'
import './AdminPage.css'

const ORDER_PAGE_LIMIT = 10

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
    month: '2-digit',
    day: '2-digit',
  })
}

function getOrderItemSummary(items = []) {
  if (items.length === 0) {
    return '상품 정보 없음'
  }

  const [firstItem, ...restItems] = items
  const suffix = restItems.length > 0 ? ` 외 ${restItems.length}개` : ''

  return `${firstItem.productName}${suffix}`
}

function getOrderUserId(user) {
  if (!user) return '-'
  if (typeof user === 'string') return user

  return user.id || user._id || user.email || '-'
}

function OrderManagementPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: ORDER_PAGE_LIMIT,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return

      setIsLoading(true)
      setError('')

      try {
        const data = await fetchOrders(token, { page: currentPage, limit: ORDER_PAGE_LIMIT })

        setOrders(data.orders || [])
        setPagination({
          total: data.total || 0,
          page: data.page || currentPage,
          limit: data.limit || ORDER_PAGE_LIMIT,
          totalPages: data.totalPages || 1,
          hasNextPage: Boolean(data.hasNextPage),
          hasPrevPage: Boolean(data.hasPrevPage),
        })
      } catch (loadError) {
        setError(loadError?.message || '주문 목록을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [currentPage, token])

  const pageNumbers = useMemo(
    () => Array.from({ length: pagination.totalPages }, (_, index) => index + 1),
    [pagination.totalPages]
  )
  const displayStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
  const displayEnd = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="admin-page">
      <AdminHeader />
      <main className="admin-main admin-orders-main">
        <div className="admin-orders-heading">
          <div>
            <p className="admin-orders-eyebrow">Order Management</p>
            <h1 className="admin-title">주문 관리</h1>
            <p className="admin-subtitle">전체 고객 주문을 최신순으로 확인합니다.</p>
          </div>
          <Link to="/admin" className="admin-orders-back">
            대시보드로 돌아가기
          </Link>
        </div>

        <section className="admin-orders-summary" aria-label="주문 요약">
          <div>
            <span>전체 주문</span>
            <strong>{pagination.total.toLocaleString()}건</strong>
          </div>
          <div>
            <span>현재 페이지</span>
            <strong>
              {pagination.page} / {pagination.totalPages}
            </strong>
          </div>
        </section>

        <section className="admin-orders-card">
          {error && <p className="admin-orders-state error">{error}</p>}
          {isLoading && <p className="admin-orders-state">주문 목록을 불러오는 중입니다.</p>}

          {!isLoading && !error && (
            <>
              {orders.length === 0 ? (
                <p className="admin-orders-state">등록된 주문이 없습니다.</p>
              ) : (
                <div className="admin-orders-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>주문번호</th>
                        <th>주문자 아이디</th>
                        <th>주문 상품</th>
                        <th>수령인</th>
                        <th>주문일</th>
                        <th>주문 상태</th>
                        <th>결제 상태</th>
                        <th>결제 금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.orderNumber}</strong>
                          </td>
                          <td className="admin-orders-user-id">{getOrderUserId(order.user)}</td>
                          <td>{getOrderItemSummary(order.items)}</td>
                          <td>{order.shippingAddress?.recipientName || '-'}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <span
                              className={`admin-orders-status status-${String(
                                order.status || ''
                              ).toLowerCase()}`}
                            >
                              {ORDER_STATUS_LABELS[order.status] || order.status || '-'}
                            </span>
                          </td>
                          <td>{PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}</td>
                          <td>
                            <strong>{formatPrice(order.totalAmount)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pagination.totalPages > 1 && (
                <nav className="admin-orders-pagination" aria-label="주문 목록 페이지네이션">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={!pagination.hasPrevPage}
                  >
                    ← 이전
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      type="button"
                      className={pageNumber === pagination.page ? 'active' : ''}
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, pagination.totalPages))}
                    disabled={!pagination.hasNextPage}
                  >
                    다음 →
                  </button>
                </nav>
              )}

              <p className="admin-orders-count">
                전체 {pagination.total}건 중 {displayStart}-{displayEnd}건 표시
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default OrderManagementPage
