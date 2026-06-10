const crypto = require('crypto');

// 네이버 OAuth 2.0 엔드포인트 URL과 state 유효 기간(10분)
const NAVER_AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_USER_URL = 'https://openapi.naver.com/v1/nid/me';
const STATE_TTL_MS = 10 * 60 * 1000;

// 필수 환경변수를 조회하고 없으면 예외를 발생시킵니다.
const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }

  return value;
};

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');

// state 위변조 방지를 위해 HMAC 서명을 생성합니다.
const signStatePayload = (payload) =>
  crypto.createHmac('sha256', getRequiredEnv('JWT_SECRET')).update(payload).digest('base64url');

// CSRF 방지용 state 값(페이로드.서명 형식)을 생성합니다.
const createState = () => {
  const payload = base64UrlEncode(
    JSON.stringify({
      nonce: crypto.randomBytes(16).toString('hex'),
      createdAt: Date.now(),
    })
  );
  const signature = signStatePayload(payload);

  return `${payload}.${signature}`;
};

// 콜백으로 돌아온 state의 서명과 유효 기간을 검증합니다.
const verifyState = (state) => {
  if (!state || !state.includes('.')) {
    return false;
  }

  const [payload, signature] = state.split('.');
  const expectedSignature = signStatePayload(payload);

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Date.now() - decoded.createdAt <= STATE_TTL_MS;
  } catch {
    return false;
  }
};

// 사용자를 네이버 로그인 화면으로 보낼 인가 URL을 생성합니다.
const getNaverAuthUrl = () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getRequiredEnv('NAVER_CLIENT_ID'),
    redirect_uri: getRequiredEnv('NAVER_REDIRECT_URI'),
    state: createState(),
  });

  return `${NAVER_AUTH_URL}?${params.toString()}`;
};

// 콜백으로 받은 인가 코드를 액세스 토큰으로 교환합니다.
const exchangeNaverCode = async (code, state) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getRequiredEnv('NAVER_CLIENT_ID'),
    client_secret: getRequiredEnv('NAVER_CLIENT_SECRET'),
    code,
    state,
  });

  const response = await fetch(`${NAVER_TOKEN_URL}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange Naver authorization code');
  }

  return data;
};

// 액세스 토큰으로 네이버 사용자 프로필을 조회합니다.
const getNaverUser = async (accessToken) => {
  const response = await fetch(NAVER_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok || data.resultcode !== '00') {
    throw new Error(data.message || 'Failed to fetch Naver user profile');
  }

  return data.response;
};

// 네이버 프로필을 서비스 공통 형식(socialId, email, name)으로 변환합니다.
const normalizeNaverUser = (profile) => ({
  socialId: String(profile.id),
  email: profile.email,
  name: profile.name || profile.nickname,
});

module.exports = {
  getNaverAuthUrl,
  verifyState,
  exchangeNaverCode,
  getNaverUser,
  normalizeNaverUser,
};
