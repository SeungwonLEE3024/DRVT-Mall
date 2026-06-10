const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    throw { ...data, status: response.status }
  }

  return data
}

export async function requestCode(email) {
  const response = await fetch(`${API_BASE}/api/auth/request-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return parseResponse(response)
}

export async function verifyCode(email, code) {
  const response = await fetch(`${API_BASE}/api/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })

  return parseResponse(response)
}

export function getSocialLoginUrl(provider) {
  return `${API_BASE}/api/auth/${provider}`
}

export const AUTH_ERROR_MESSAGES = {
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  USER_NOT_FOUND: '가입된 계정이 없습니다. 인증코드를 먼저 요청해주세요.',
  NO_OTP: '인증코드를 먼저 요청해주세요.',
  OTP_EXPIRED: '인증코드가 만료되었습니다. 다시 요청해주세요.',
  OTP_INVALID: '인증코드가 올바르지 않습니다.',
  OTP_MAX_ATTEMPTS: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.',
  default: '요청 처리 중 오류가 발생했습니다.',
}

export function getAuthErrorMessage(error) {
  if (error?.errors?.length) {
    return error.errors[0].message
  }

  return AUTH_ERROR_MESSAGES[error?.code] || error?.message || AUTH_ERROR_MESSAGES.default
}
