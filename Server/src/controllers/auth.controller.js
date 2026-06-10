const User = require('../models/User');
const { sendOtpEmail } = require('../services/email');
const {
  getKakaoAuthUrl,
  exchangeKakaoCode,
  getKakaoUser,
  normalizeKakaoUser,
} = require('../services/kakao');
const {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUser,
  normalizeGoogleUser,
} = require('../services/google');
const {
  getNaverAuthUrl,
  verifyState,
  exchangeNaverCode,
  getNaverUser,
  normalizeNaverUser,
} = require('../services/naver');
const { signToken } = require('../utils/token');

// OTP 검증 실패 사유를 HTTP 응답 코드와 메시지로 매핑합니다.
const OTP_ERROR_MAP = {
  NO_OTP: { status: 400, code: 'NO_OTP', message: 'No verification code requested. Please request a new code.' },
  EXPIRED: { status: 400, code: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new code.' },
  INVALID: { status: 400, code: 'OTP_INVALID', message: 'Invalid verification code.' },
  MAX_ATTEMPTS: {
    status: 429,
    code: 'OTP_MAX_ATTEMPTS',
    message: 'Too many failed attempts. Please request a new code.',
  },
};

// OAuth 완료 후 되돌아갈 클라이언트 주소를 가져옵니다.
const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// 로그인 응답/콜백에 포함할 사용자 공개 정보를 정리합니다.
const formatAuthUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  isVerified: user.isVerified,
  marketingOptIn: user.marketingOptIn,
  role: user.role,
});

// 소셜 로그인 실패 시 프론트 인증 화면으로 에러 메시지를 전달합니다.
const redirectWithAuthError = (res, message) => {
  const url = new URL('/auth', getClientUrl());
  url.searchParams.set('error', message);
  return res.redirect(url.toString());
};

// 소셜 제공자가 이메일을 주지 않을 때 내부 식별용 이메일을 생성합니다.
const getSocialFallbackEmail = (provider, socialId) => {
  return `${provider}_${socialId}@social.drvt.local`.toLowerCase();
};

// 기존 임시 이메일인지 확인해 실제 이메일로 교체할 수 있게 합니다.
const isSocialFallbackEmail = (email) => email?.endsWith('@social.drvt.local');

// 소셜 계정으로 기존 유저를 찾거나, 같은 이메일 유저에 연결하거나, 새 유저를 생성합니다.
const findOrCreateSocialUser = async (provider, socialUser) => {
  let user = await User.findBySocial(provider, socialUser.socialId);
  const email = socialUser.email || getSocialFallbackEmail(provider, socialUser.socialId);

  if (user) {
    let shouldSave = false;

    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    if (!user.name && socialUser.name) {
      user.name = socialUser.name;
      shouldSave = true;
    }

    if (socialUser.email && isSocialFallbackEmail(user.email)) {
      user.email = socialUser.email;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }

    return user;
  }

  user = socialUser.email ? await User.findByEmail(socialUser.email) : null;

  if (user) {
    const hasSocialAccount = user.socialAccounts.some(
      (account) => account.provider === provider && account.socialId === socialUser.socialId
    );

    if (!hasSocialAccount) {
      user.socialAccounts.push({ provider, socialId: socialUser.socialId });
    }

    if (!user.name && socialUser.name) {
      user.name = socialUser.name;
    }

    user.isVerified = true;
    await user.save();
    return user;
  }

  return User.create({
    email,
    name: socialUser.name,
    isVerified: true,
    socialAccounts: [{ provider, socialId: socialUser.socialId }],
  });
};

// 소셜 로그인 성공 시 JWT와 사용자 정보를 프론트 콜백 페이지로 전달합니다.
const redirectWithAuthSuccess = (res, user) => {
  const token = signToken(user);
  const url = new URL('/auth/callback', getClientUrl());

  url.searchParams.set('token', token);
  url.searchParams.set('user', JSON.stringify(formatAuthUser(user)));

  return res.redirect(url.toString());
};

// 이메일을 받아 기존 유저를 찾거나 새로 생성한 뒤 OTP 코드를 발송합니다.
const requestCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    let user = await User.findByEmailForOtp(email);

    if (!user) {
      user = await User.create({ email });
      user = await User.findByEmailForOtp(email);
    }

    const code = await user.generateOtp();
    await sendOtpEmail(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      isNewUser: !user.isVerified,
    });
  } catch (error) {
    next(error);
  }
};

// 이메일과 OTP 코드를 검증하고 성공 시 JWT를 발급합니다.
const verifyCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const user = await User.findByEmailForOtp(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found. Please request a verification code first.',
      });
    }

    const result = await user.verifyOtp(code);

    if (!result.success) {
      const error = OTP_ERROR_MAP[result.reason] || OTP_ERROR_MAP.INVALID;

      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
        ...(result.remainingAttempts !== undefined && {
          remainingAttempts: result.remainingAttempts,
        }),
      });
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        marketingOptIn: user.marketingOptIn,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 카카오 로그인 동의 화면으로 리다이렉트합니다.
const kakaoLogin = (req, res, next) => {
  try {
    res.redirect(getKakaoAuthUrl());
  } catch (error) {
    next(error);
  }
};

// 카카오 콜백에서 토큰/프로필을 조회하고 유저 로그인 또는 회원가입을 처리합니다.
const kakaoCallback = async (req, res, next) => {
  try {
    const { code, error, error_description: errorDescription } = req.query;

    if (error) {
      return redirectWithAuthError(res, errorDescription || '카카오 로그인이 취소되었습니다.');
    }

    if (!code) {
      return redirectWithAuthError(res, '카카오 인증 코드가 없습니다.');
    }

    const tokenData = await exchangeKakaoCode(code);
    const kakaoProfile = await getKakaoUser(tokenData.access_token);
    const kakaoUser = normalizeKakaoUser(kakaoProfile);

    if (!kakaoUser.email) {
      return redirectWithAuthError(res, '카카오 계정에서 이메일 제공 동의가 필요합니다.');
    }

    const user = await findOrCreateSocialUser('kakao', kakaoUser);

    return redirectWithAuthSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// 구글 로그인 동의 화면으로 리다이렉트합니다.
const googleLogin = (req, res, next) => {
  try {
    res.redirect(getGoogleAuthUrl());
  } catch (error) {
    next(error);
  }
};

// 구글 콜백에서 토큰/프로필을 조회하고 유저 로그인 또는 회원가입을 처리합니다.
const googleCallback = async (req, res, next) => {
  try {
    const { code, error, error_description: errorDescription } = req.query;

    if (error) {
      return redirectWithAuthError(res, errorDescription || '구글 로그인이 취소되었습니다.');
    }

    if (!code) {
      return redirectWithAuthError(res, '구글 인증 코드가 없습니다.');
    }

    const tokenData = await exchangeGoogleCode(code);
    const googleProfile = await getGoogleUser(tokenData.access_token);
    const googleUser = normalizeGoogleUser(googleProfile);

    if (!googleUser.email) {
      return redirectWithAuthError(res, '구글 계정 이메일을 가져올 수 없습니다.');
    }

    const user = await findOrCreateSocialUser('google', googleUser);

    return redirectWithAuthSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// 네이버 로그인 동의 화면으로 리다이렉트합니다.
const naverLogin = (req, res, next) => {
  try {
    res.redirect(getNaverAuthUrl());
  } catch (error) {
    next(error);
  }
};

// 네이버 콜백에서 state를 검증한 뒤 유저 로그인 또는 회원가입을 처리합니다.
const naverCallback = async (req, res, next) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return redirectWithAuthError(res, errorDescription || '네이버 로그인이 취소되었습니다.');
    }

    if (!code) {
      return redirectWithAuthError(res, '네이버 인증 코드가 없습니다.');
    }

    if (!verifyState(state)) {
      return redirectWithAuthError(res, '네이버 로그인 요청이 만료되었거나 올바르지 않습니다.');
    }

    const tokenData = await exchangeNaverCode(code, state);
    const naverProfile = await getNaverUser(tokenData.access_token);
    const naverUser = normalizeNaverUser(naverProfile);

    const user = await findOrCreateSocialUser('naver', naverUser);

    return redirectWithAuthSuccess(res, user);
  } catch (error) {
    return redirectWithAuthError(res, error.message || '네이버 로그인 처리 중 오류가 발생했습니다.');
  }
};

module.exports = {
  requestCode,
  verifyCode,
  kakaoLogin,
  kakaoCallback,
  googleLogin,
  googleCallback,
  naverLogin,
  naverCallback,
};
