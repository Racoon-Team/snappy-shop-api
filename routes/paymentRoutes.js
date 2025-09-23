const express = require("express");
const router = express.Router();
const {
  getBankToken,
  createPaymentQr,
} = require("../controller/paymentController");

router.post("/token", getBankToken);

router.post("/qr", createPaymentQr);

module.exports = router;
