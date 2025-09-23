require("dotenv").config();

const axios = require("axios");
const BANK_API_BASE = process.env.BANK_API_BASE;

async function generateBankToken(accountId, authorizationId) {
  const { data } = await axios.post(`${BANK_API_BASE}/auth/token`, {
    accountId,
    authorizationId,
  });
  const token = data.access_token || data.token;
  if (!token) throw new Error("The bank did not develop access_token/token");
  return token;
}

async function generateBankPaymentQr(token, amount) {
  try {
    const { data } = await axios.post(
      `${BANK_API_BASE}/payments/qr`,
      { amount },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const qr = data.qr || data.qrData || data.qr_code;
    return qr || `BANKPAY|AMOUNT:${amount}|TS:${Date.now()}`;
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return `BANKPAY|AMOUNT:${amount}|TS:${Date.now()}`;
  }
}

module.exports = {
  generateBankToken,
  generateBankPaymentQr,
};
