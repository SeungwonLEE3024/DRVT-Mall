import { Link } from 'react-router-dom'

const ORDERS = [
  { id: 'ORD-001234', customer: '김민수', date: '2024-12-30', status: '처리중', amount: '$219' },
  { id: 'ORD-001233', customer: '이지은', date: '2024-12-30', status: '배송중', amount: '$156' },
  { id: 'ORD-001232', customer: '박서준', date: '2024-12-29', status: '완료', amount: '$89' },
  { id: 'ORD-001231', customer: '최유나', date: '2024-12-29', status: '처리중', amount: '$342' },
  { id: 'ORD-001230', customer: '정하늘', date: '2024-12-28', status: '완료', amount: '$127' },
]

const STATUS_CLASS = {
  처리중: 'admin-order-status--processing',
  배송중: 'admin-order-status--shipping',
  완료: 'admin-order-status--done',
}

function RecentOrders() {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">최근 주문</h2>
        <Link to="/admin/orders" className="admin-view-all">
          전체보기
        </Link>
      </div>
      <ul className="admin-order-list">
        {ORDERS.map((order) => (
          <li key={order.id} className="admin-order-item">
            <div className="admin-order-main">
              <p className="admin-order-id">{order.id}</p>
              <p className="admin-order-meta">
                {order.customer}, {order.date}
              </p>
            </div>
            <div className="admin-order-side">
              <span className={`admin-order-status ${STATUS_CLASS[order.status]}`}>
                {order.status}
              </span>
              <span className="admin-order-amount">{order.amount}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecentOrders
