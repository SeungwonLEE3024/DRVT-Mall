import { Link } from 'react-router-dom'

function UserMenu({ isAuthenticated, user, isOpen, onToggle, onLogout }) {
  if (!isAuthenticated) {
    return (
      <Link to="/auth" className="header-login">
        로그인
      </Link>
    )
  }

  return (
    <div className="header-user-menu">
      <button
        type="button"
        className="header-user-button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {user?.email}
        <span className="header-user-caret">▾</span>
      </button>

      {isOpen && (
        <div className="header-dropdown" role="menu">
          <Link to="/mypage" className="header-dropdown-item" onClick={onToggle} role="menuitem">
            마이페이지
          </Link>
          <button type="button" className="header-dropdown-item" onClick={onLogout} role="menuitem">
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
