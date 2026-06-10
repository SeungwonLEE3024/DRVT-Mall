import AdminHeader from '../components/admin/AdminHeader'
import StatCard from '../components/admin/StatCard'
import QuickActions from '../components/admin/QuickActions'
import ManagementCards from '../components/admin/ManagementCards'
import RecentOrders from '../components/admin/RecentOrders'
import './AdminPage.css'

const STATS = [
  {
    label: '총 주문',
    value: '1,234',
    trend: '+12% from last month',
    iconClass: 'admin-stat-icon--orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    label: '총 상품',
    value: '156',
    trend: '+3% from last month',
    iconClass: 'admin-stat-icon--products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    label: '총 고객',
    value: '2,345',
    trend: '+8% from last month',
    iconClass: 'admin-stat-icon--customers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: '총 매출',
    value: '$45,678',
    trend: '+15% from last month',
    iconClass: 'admin-stat-icon--sales',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
]

function AdminPage() {
  return (
    <div className="admin-page">
      <AdminHeader />
      <main className="admin-main">
        <div className="admin-intro">
          <h1 className="admin-title">관리자 대시보드</h1>
          <p className="admin-subtitle">
            DRVT Mall 쇼핑몰 관리 시스템에 오신 것을 환영합니다.
          </p>
        </div>

        <div className="admin-stats">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="admin-content">
          <QuickActions />
          <RecentOrders />
          <ManagementCards />
        </div>
      </main>
    </div>
  )
}

export default AdminPage
