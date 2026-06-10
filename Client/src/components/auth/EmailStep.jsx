import SocialButtons from './SocialButtons'

function EmailStep({ email, loading, onEmailChange, onSubmit, onSocialLogin }) {
  return (
    <>
      <form className="auth-form" onSubmit={onSubmit}>
        <input
          type="email"
          className="auth-input"
          placeholder="이메일"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
        />

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? '처리 중...' : '계속하기'}
        </button>

        <p className="auth-terms">
          계속 진행하면 독점 제공 및 판촉 업데이트를 받게 됩니다. <a href="#">이용약관</a> 및{' '}
          <a href="#">개인정보정책</a>을 확인하십시오.
        </p>
      </form>

      <div className="auth-divider">
        <span>또는</span>
      </div>
      <SocialButtons onSelect={onSocialLogin} />
    </>
  )
}

export default EmailStep
