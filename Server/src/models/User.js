const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// OTP 정책 상수: 6자리 코드, 10분 만료, 최대 5회 시도
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

// 배송지 서브 스키마입니다.
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true }, // 배송지명 (집, 회사 등)
    zipCode: { type: String, trim: true }, // 우편번호
    address1: { type: String, trim: true }, // 기본 주소
    address2: { type: String, trim: true }, // 상세 주소
    isDefault: { type: Boolean, default: false }, // 기본 배송지 여부
  },
  { _id: true }
);

// 소셜 로그인 계정 서브 스키마입니다.
const socialAccountSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google', 'naver', 'kakao'],
      required: true,
    },
    socialId: { type: String, required: true, trim: true }, // 소셜 서비스가 발급한 고유 식별자
  },
  { _id: false }
);

// 회원 정보를 저장하는 스키마입니다.
const userSchema = new mongoose.Schema(
  {
    // 이메일 (로그인 식별자, 유니크)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, trim: true }, // 이름
    phone: { type: String, trim: true }, // 연락처
    isVerified: { type: Boolean, default: false }, // 이메일 인증 완료 여부
    marketingOptIn: { type: Boolean, default: false }, // 마케팅 수신 동의 여부

    // 이메일 OTP 인증 정보 (보안을 위해 기본 조회에서 제외)
    otp: {
      hash: { type: String, select: false }, // bcrypt로 해시된 인증코드
      expiresAt: { type: Date, select: false }, // 인증코드 만료 시각
      attempts: { type: Number, default: 0, select: false }, // 검증 시도 횟수
    },

    // 연결된 소셜 로그인 계정 목록
    socialAccounts: {
      type: [socialAccountSchema],
      default: [],
    },

    // 저장된 배송지 목록
    addresses: {
      type: [addressSchema],
      default: [],
    },

    // 권한 (일반 사용자 / 관리자)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  // createdAt, updatedAt 자동 기록
  { timestamps: true }
);

// 같은 소셜 계정으로 중복 가입을 방지하는 복합 유니크 인덱스입니다.
userSchema.index({ 'socialAccounts.provider': 1, 'socialAccounts.socialId': 1 }, { unique: true, sparse: true });

// 6자리 숫자 인증코드를 생성합니다.
function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 새 OTP를 생성해 해시로 저장하고 평문 코드를 반환합니다. (평문은 이메일 발송용)
userSchema.methods.generateOtp = async function () {
  const code = generateOtpCode();
  const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);

  this.otp = {
    hash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
  };

  await this.save({ validateBeforeSave: false });

  return code;
};

// 입력된 코드를 검증합니다. 만료/시도 초과/불일치를 구분해 결과를 반환합니다.
userSchema.methods.verifyOtp = async function (code) {
  // 발급된 OTP가 없는 경우
  if (!this.otp?.hash || !this.otp?.expiresAt) {
    return { success: false, reason: 'NO_OTP' };
  }

  // 만료된 경우 OTP를 무효화합니다.
  if (this.otp.expiresAt < new Date()) {
    this.otp = undefined;
    await this.save({ validateBeforeSave: false });
    return { success: false, reason: 'EXPIRED' };
  }

  // 최대 시도 횟수를 초과한 경우 OTP를 무효화합니다.
  if (this.otp.attempts >= MAX_OTP_ATTEMPTS) {
    this.otp = undefined;
    await this.save({ validateBeforeSave: false });
    return { success: false, reason: 'MAX_ATTEMPTS' };
  }

  // 해시 비교로 코드 일치 여부를 확인합니다.
  const isValid = await bcrypt.compare(String(code), this.otp.hash);

  if (!isValid) {
    // 틀린 경우 시도 횟수를 증가시키고, 초과 시 OTP를 무효화합니다.
    this.otp.attempts += 1;

    if (this.otp.attempts >= MAX_OTP_ATTEMPTS) {
      this.otp = undefined;
    }

    await this.save({ validateBeforeSave: false });

    if (!this.otp) {
      return { success: false, reason: 'MAX_ATTEMPTS' };
    }

    return {
      success: false,
      reason: 'INVALID',
      remainingAttempts: MAX_OTP_ATTEMPTS - this.otp.attempts,
    };
  }

  // 검증 성공: OTP는 1회용이므로 제거하고 인증 완료로 표시합니다.
  this.otp = undefined;
  this.isVerified = true;
  await this.save({ validateBeforeSave: false });

  return { success: true };
};

// 발급된 OTP를 무효화합니다.
userSchema.methods.clearOtp = async function () {
  this.otp = undefined;
  await this.save({ validateBeforeSave: false });
};

// 이메일로 사용자를 조회합니다.
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// OTP 검증용으로 숨겨진 otp 필드까지 포함해 사용자를 조회합니다.
userSchema.statics.findByEmailForOtp = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select(
    '+otp.hash +otp.expiresAt +otp.attempts'
  );
};

// 소셜 제공자와 소셜 ID로 사용자를 조회합니다.
userSchema.statics.findBySocial = function (provider, socialId) {
  return this.findOne({
    socialAccounts: { $elemMatch: { provider, socialId } },
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
