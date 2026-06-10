function StatCard({ label, value, trend, icon, iconClass }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-info">
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value}</p>
        <p className="admin-stat-trend">{trend}</p>
      </div>
      <div className={`admin-stat-icon ${iconClass}`}>{icon}</div>
    </div>
  )
}

export default StatCard
