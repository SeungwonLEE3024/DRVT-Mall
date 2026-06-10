import { Link } from 'react-router-dom'

function MobileHeader({ onMenuOpen }) {
  return (
    <div className="mobile-header-bar">
      <button type="button" className="mobile-icon-button" onClick={onMenuOpen} aria-label="메뉴 열기">
        <span />
        <span />
        <span />
      </button>
      <Link to="/" className="mobile-logo-link">
        DRVT Mall
      </Link>
      <button type="button" className="mobile-search-button" aria-label="검색">
        <span />
      </button>
    </div>
  )
}

export default MobileHeader
