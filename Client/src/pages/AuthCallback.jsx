import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')

    if (!token || !userParam) {
      navigate('/auth', { replace: true })
      return
    }

    try {
      login(token, JSON.parse(userParam))
      navigate('/', { replace: true })
    } catch {
      navigate('/auth', { replace: true })
    }
  }, [login, navigate, searchParams])

  return (
    <main className="home">
      <section className="hero">
        <h2>로그인 처리 중입니다</h2>
        <p>잠시만 기다려주세요.</p>
      </section>
    </main>
  )
}

export default AuthCallback
