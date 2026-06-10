function OtpStep({ email, code, loading, onCodeChange, onSubmit, onBack, onResend }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <p className="auth-otp-guide">
        <strong>{email}</strong>로 발송된 6자리 인증코드를 입력해주세요.
      </p>

      <input
        type="text"
        className="auth-input auth-otp-input"
        placeholder="인증코드 6자리"
        value={code}
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
      />

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? '확인 중...' : '확인'}
      </button>

      <div className="auth-otp-actions">
        <button type="button" onClick={onBack} disabled={loading}>
          이메일 변경
        </button>
        <button type="button" onClick={onResend} disabled={loading}>
          인증코드 재발송
        </button>
      </div>
    </form>
  )
}

export default OtpStep
