// 포트원 V2 결제 조회 API 주소
const PORTONE_API_URL = 'https://api.portone.io';

// 필수 환경변수를 조회하고 없으면 예외를 발생시킵니다.
const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }

  return value;
};

// 포트원 V2 API로 결제 단건을 조회합니다.
const getPayment = async (paymentId) => {
  const apiSecret = getRequiredEnv('PORTONE_V2_API_SECRET');

  const response = await fetch(
    `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch payment: ${paymentId}`);
  }

  return data;
};

// 결제가 완료 상태이고 결제 금액이 주문 금액과 일치하는지 검증합니다.
// 검증 실패 시 사유를 담은 결과 객체를 반환합니다.
const verifyPayment = async (paymentId, expectedAmount) => {
  const payment = await getPayment(paymentId);

  if (payment.status !== 'PAID') {
    return {
      verified: false,
      reason: `Payment status is ${payment.status}, expected PAID`,
      payment,
    };
  }

  const paidAmount = payment.amount?.total;

  if (paidAmount !== expectedAmount) {
    return {
      verified: false,
      reason: `Paid amount (${paidAmount}) does not match order amount (${expectedAmount})`,
      payment,
    };
  }

  return { verified: true, payment };
};

module.exports = { getPayment, verifyPayment };
