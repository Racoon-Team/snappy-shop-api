const Payment = require("../models/Payment");
const {
  generateBankToken,
  generateBankPaymentQr,
} = require("../lib/bank/bank");
const QRCode = require("qrcode");

const getBankToken = async (req, res) => {
  try {
    const { accountId, authorizationId } = req.body;
    if (!accountId || !authorizationId) {
      return res
        .status(400)
        .json({ message: "accountId y authorizationId falta" });
    }
    const token = await generateBankToken(accountId, authorizationId);

    res.json({ token });
  } catch (err) {
    console.error("Error in getBankToken:", err);
    res.status(500).json({ message: err.message });
  }
};

const createPaymentQr = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    const { amount, orderId } = req.body;

    if (!token || !amount) {
      return res.status(400).json({ message: "Missing token or amount" });
    }

    const qrData = await generateBankPaymentQr(token, amount);
    if (!qrData || typeof qrData !== "string") {
      return res
        .status(502)
        .json({ message: "Invalid QR code returned by the bank" });
    }
    const qrImage = await QRCode.toDataURL(qrData);
    const paymentDoc = {
      token,
      qrCode: qrData,
      amount,
      currency: "BOB",
      status: "Pending",
    };
    if (orderId) paymentDoc.order = orderId;

    try {
      const payment = new Payment(paymentDoc);
      await payment.save();
    } catch (e) {
      console.warn(
        "[createPaymentQr] Payment could not be saved (we continue as usual):",
        e.message,
      );
    }

    return res.json({ success: true, qrImage });
  } catch (err) {
    console.error("Error in createPaymentQr:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBankToken, createPaymentQr };
