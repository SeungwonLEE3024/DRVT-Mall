import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { requestCode, verifyCode, getAuthErrorMessage, getSocialLoginUrl } from '../services/auth'
import AuthMessage from '../components/auth/AuthMessage'
import EmailStep from '../components/auth/EmailStep'
import OtpStep from '../components/auth/OtpStep'
import './AuthPage.css'

const SOCIAL_LABELS = { kakao: '카카오', google: '구글', naver: '네이버' }

function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const [step, setStep] = useState('input')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => searchParams.get('error') || '')
  const [info, setInfo] = useState('')

  const handleClose = () => navigate('/')

  const handleSocialLogin = (provider) => {
    setError('')
    setInfo('')
    setStep('input')
    setCode('')

    if (provider === 'kakao' || provider === 'google' || provider === 'naver') {
      window.location.href = getSocialLoginUrl(provider)
      return
    }

    setInfo(`${SOCIAL_LABELS[provider]} 로그인은 준비 중입니다.`)
  }

  const handleContinue = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const result = await requestCode(email.trim())
      setStep('otp')
      setCode('')
      setInfo(result.message || '이메일로 인증코드를 발송했습니다.')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const result = await verifyCode(email.trim(), code)
      login(result.token, result.user)
      navigate('/')
    } catch (err) {
      const message = getAuthErrorMessage(err)

      if (err?.remainingAttempts !== undefined) {
        setError(`${message} (남은 시도: ${err.remainingAttempts}회)`)
      } else {
        setError(message)
      }

      if (err?.code === 'OTP_EXPIRED' || err?.code === 'OTP_MAX_ATTEMPTS') {
        setStep('input')
        setCode('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const result = await requestCode(email.trim())
      setCode('')
      setInfo(result.message || '인증코드를 다시 발송했습니다.')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="로그인">
        <button type="button" className="auth-close" onClick={handleClose} aria-label="닫기">
          ×
        </button>

        <h2 className="auth-title">로그인 / 회원가입</h2>
        <p className="auth-subtitle">이메일 또는 소셜 계정으로 간편하게 시작하세요</p>

        {step === 'input' ? (
          <EmailStep
            email={email}
            loading={loading}
            onEmailChange={setEmail}
            onSubmit={handleContinue}
            onSocialLogin={handleSocialLogin}
          />
        ) : (
          <OtpStep
            email={email}
            code={code}
            loading={loading}
            onCodeChange={setCode}
            onSubmit={handleVerify}
            onBack={() => setStep('input')}
            onResend={handleResend}
          />
        )}

        <AuthMessage error={error} info={info} />
      </div>
    </div>
  )
}

export default AuthPage
