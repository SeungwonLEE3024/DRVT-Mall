const { Resend } = require('resend');

const OTP_EXPIRY_MINUTES = 10;
const RESEND_TEST_RECIPIENT_ERROR = 'You can only send testing emails to your own email address';

// 개발 환경에서 Resend 테스트 수신자 제한 오류가 발생하면 콘솔 출력으로 대체할지 판단합니다.
const shouldFallbackToConsole = (error) =>
  process.env.NODE_ENV === 'development' &&
  process.env.EMAIL_CONSOLE_FALLBACK === 'true' &&
  error?.message?.includes(RESEND_TEST_RECIPIENT_ERROR);

// 이메일 발송 대신 콘솔에 인증코드를 출력합니다. (개발용 대체 수단)
const logOtpToConsole = (email, code, reason) => {
  console.warn(`[OTP Email Fallback] ${reason}`);
  console.log(`[OTP Email Fallback] to: ${email}, code: ${code}`);
};

// 인증코드 이메일의 HTML 본문을 생성합니다.
const buildOtpHtml = (code) => `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:40px 32px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:22px;color:#111;">DRVT Mall</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">아래 인증코드를 입력해주세요.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0;">
              <div style="display:inline-block;background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:16px 32px;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111;">${code}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">
                이 코드는 ${OTP_EXPIRY_MINUTES}분 후 만료되며, 1회만 사용할 수 있습니다.<br />
                본인이 요청하지 않았다면 이 이메일을 무시해주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Resend API로 OTP 인증코드 이메일을 발송합니다.
const sendOtpEmail = async (email, code) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }

  if (!from) {
    throw new Error('EMAIL_FROM is not defined in environment variables');
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: `[DRVT Mall] 인증코드: ${code}`,
    html: buildOtpHtml(code),
  });

  if (error) {
    // 개발 환경의 테스트 수신자 제한이면 콘솔 출력으로 대체하고 성공 처리합니다.
    if (shouldFallbackToConsole(error)) {
      logOtpToConsole(email, code, error.message);
      return { success: true, fallback: 'console' };
    }

    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { success: true, id: data.id };
};

module.exports = { sendOtpEmail };
