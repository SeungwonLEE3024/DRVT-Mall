import { Link } from 'react-router-dom'

function CartLink({ count = 0 }) {
  return (
    <Link to="/cart" className="header-cart-link" aria-label={`장바구니 ${count}개`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
      <span>{count}</span>
    </Link>
  )
}

export default CartLink
