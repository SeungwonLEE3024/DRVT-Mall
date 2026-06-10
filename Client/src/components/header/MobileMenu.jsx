import { Link } from 'react-router-dom'

function MobileMenu({ isAuthenticated, isAdmin, cartCount = 0, user, onClose, onLogout }) {
  return (
    <div className="mobile-menu-panel" onClick={onClose}>
      <div className="mobile-menu-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-menu-head">
          <span>Dr.VT</span>
          <button type="button" onClick={onClose} aria-label="메뉴 닫기">
            ×
          </button>
        </div>

        <div className="mobile-member-links">
          {isAuthenticated ? (
            <>
              <Link to="/mypage" onClick={onClose}>
                {user?.email}
              </Link>
              <button type="button" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={onClose}>
                회원가입
              </Link>
              <Link to="/auth" onClick={onClose}>
                로그인
              </Link>
            </>
          )}
          <a href="#best-seller" onClick={onClose}>
            주문조회
          </a>
          <a href="#new-arrivals" onClick={onClose}>
            최근본상품
          </a>
          <Link to="/cart" onClick={onClose}>
            장바구니 {cartCount}
          </Link>
        </div>

        <nav className="mobile-category-nav" aria-label="모바일 카테고리">
          {isAdmin && (
            <Link to="/admin" onClick={onClose}>
              어드민 페이지 <span>admin</span>
            </Link>
          )}
          <a href="#best-seller" onClick={onClose}>
            헬스케어 <span>Health care</span>
          </a>
          <a href="#event" onClick={onClose}>
            헤어케어 <span>Hair care</span>
          </a>
          <a href="#new-arrivals" onClick={onClose}>
            전체보기 <span>all products</span>
          </a>
        </nav>

        <div className="mobile-service">
          <button type="button">
            고객센터 <span>+</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
