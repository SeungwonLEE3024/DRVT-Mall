// 카카오 OAuth 2.0 엔드포인트 URL
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

// 필수 환경변수를 조회하고 없으면 예외를 발생시킵니다.
const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }

  return value;
};

// 사용자를 카카오 로그인 화면으로 보낼 인가 URL을 생성합니다.
const getKakaoAuthUrl = () => {
  const clientId = getRequiredEnv('KAKAO_CLIENT_ID');
  const redirectUri = getRequiredEnv('KAKAO_REDIRECT_URI');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'account_email profile_nickname',
  });

  return `${KAKAO_AUTH_URL}?${params.toString()}`;
};

// 콜백으로 받은 인가 코드를 액세스 토큰으로 교환합니다.
const exchangeKakaoCode = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getRequiredEnv('KAKAO_CLIENT_ID'),
    redirect_uri: getRequiredEnv('KAKAO_REDIRECT_URI'),
    code,
  });

  // 카카오는 client_secret이 선택 사항이라 설정된 경우에만 포함합니다.
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange Kakao authorization code');
  }

  return data;
};

// 액세스 토큰으로 카카오 사용자 프로필을 조회합니다.
const getKakaoUser = async (accessToken) => {
  const response = await fetch(KAKAO_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || data.error || 'Failed to fetch Kakao user profile');
  }

  return data;
};

// 카카오 프로필을 서비스 공통 형식(socialId, email, name)으로 변환합니다.
const normalizeKakaoUser = (profile) => ({
  socialId: String(profile.id),
  email: profile.kakao_account?.email,
  name: profile.kakao_account?.profile?.nickname || profile.properties?.nickname,
});

module.exports = {
  getKakaoAuthUrl,
  exchangeKakaoCode,
  getKakaoUser,
  normalizeKakaoUser,
};
