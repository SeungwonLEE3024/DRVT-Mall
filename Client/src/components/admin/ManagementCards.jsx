import { Link } from 'react-router-dom'

const MANAGEMENT_ITEMS = [
  {
    title: '상품 관리',
    description: '상품 등록, 수정, 삭제 및 재고 관리',
    icon: '📦',
    to: '/admin/products',
  },
  {
    title: '주문 관리',
    description: '주문 조회, 상태 변경 및 배송 관리',
    icon: '🛒',
    to: '/admin/orders',
  },
]

function ManagementCards() {
  return (
    <section className="admin-management-cards" aria-label="관리 메뉴">
      {MANAGEMENT_ITEMS.map((item) => (
        <Link to={item.to} className="admin-management-card" key={item.title}>
          <span className="admin-management-icon" aria-hidden="true">
            {item.icon}
          </span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </Link>
      ))}
    </section>
  )
}

export default ManagementCards
