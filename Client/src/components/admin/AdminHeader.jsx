import { Link } from 'react-router-dom'

function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <div className="admin-brand">
          <span className="admin-brand-name">DRVT Mall</span>
          <span className="admin-badge">ADMIN</span>
        </div>
        <Link to="/" className="admin-back-btn">
          쇼핑몰로 돌아가기
        </Link>
      </div>
    </header>
  )
}

export default AdminHeader
