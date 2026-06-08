import { useEffect, useState } from 'react'
import { fetchHealth } from '../services/api'

function Home() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="home">
      <section className="hero">
        <h2>React + Vite 프로젝트가 준비되었습니다</h2>
        <p>Server API와 연동하여 쇼핑몰 기능을 개발할 수 있습니다.</p>
      </section>

      <section className="status-card">
        <h3>API 연결 상태</h3>
        {loading && <p className="status loading">확인 중...</p>}
        {error && <p className="status error">연결 실패: {error}</p>}
        {health && (
          <div className="status success">
            <p>{health.message}</p>
            <p>Database: {health.database}</p>
            <p className="timestamp">{health.timestamp}</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default Home
