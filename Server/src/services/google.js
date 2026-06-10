// 구글 OAuth 2.0 엔드포인트 URL
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// 필수 환경변수를 조회하고 없으면 예외를 발생시킵니다.
const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }

  return value;
};

// 사용자를 구글 로그인 화면으로 보낼 인가 URL을 생성합니다.
const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: getRequiredEnv('GOOGLE_REDIRECT_URI'),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

// 콜백으로 받은 인가 코드를 액세스 토큰으로 교환합니다.
const exchangeGoogleCode = async (code) => {
  const body = new URLSearchParams({
    code,
    client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
    client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: getRequiredEnv('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange Google authorization code');
  }

  return data;
};

// 액세스 토큰으로 구글 사용자 프로필을 조회합니다.
const getGoogleUser = async (accessToken) => {
  const response = await fetch(GOOGLE_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to fetch Google user profile');
  }

  return data;
};

// 구글 프로필을 서비스 공통 형식(socialId, email, name)으로 변환합니다.
const normalizeGoogleUser = (profile) => ({
  socialId: String(profile.id),
  email: profile.email,
  name: profile.name,
});

module.exports = {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUser,
  normalizeGoogleUser,
};
