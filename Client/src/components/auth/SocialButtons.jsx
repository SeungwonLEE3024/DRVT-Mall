const PROVIDERS = [
  { id: 'kakao', label: '카카오로 계속하기', className: 'social-kakao' },
  { id: 'google', label: '구글로 계속하기', className: 'social-google' },
  { id: 'naver', label: '네이버로 계속하기', className: 'social-naver' },
]

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="#191919"
        d="M12 4C7.03 4 3 7.13 3 11c0 2.55 1.68 4.78 4.2 6.05L6.2 19.5l3.52-2.3c.74.1 1.5.16 2.28.16 4.97 0 9-3.13 9-7s-4.03-7-9-7z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.78-.07-1.53-.2-2.27H12v4.3h6.48a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.95 3.44-8.41z" />
      <path fill="#34A853" d="M12 24c3.12 0 5.74-1.03 7.65-2.8l-3.72-2.9c-1.03.69-2.35 1.1-3.93 1.1-3.02 0-5.58-2.04-6.49-4.78H1.66v3.01A11.96 11.96 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.51 14.62A7.18 7.18 0 0 1 5.14 12c0-.91.16-1.79.37-2.62V6.37H1.66a11.96 11.96 0 0 0 0 10.26l3.85-3.01z" />
      <path fill="#EA4335" d="M12 4.77c1.69 0 3.2.58 4.39 1.72l3.29-3.29C17.71 1.2 15.12 0 12 0 7.31 0 3.28 2.69 1.66 6.37l3.85 3.01C6.42 6.81 9 4.77 12 4.77z" />
    </svg>
  )
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M4 4h4.2l5.1 7.2V4H17.4v16h-4.2l-5.1-7.2V20H4V4z"
      />
    </svg>
  )
}

const ICONS = {
  kakao: KakaoIcon,
  google: GoogleIcon,
  naver: NaverIcon,
}

function SocialButtons({ onSelect }) {
  const handleSelect = (event, provider) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect(provider)
  }

  return (
    <div className="auth-social">
      {PROVIDERS.map(({ id, label, className }) => {
        const Icon = ICONS[id]

        return (
          <button
            key={id}
            type="button"
            className={`auth-social-btn ${className}`}
            onClick={(event) => handleSelect(event, id)}
            aria-label={label}
            title={label}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}

export default SocialButtons
