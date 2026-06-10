function AuthMessage({ error, info }) {
  if (error) {
    return <p className="auth-message error">{error}</p>
  }

  if (info) {
    return <p className="auth-message info">{info}</p>
  }

  return null
}

export default AuthMessage
