const payments = [
  {
    _id: "64a1713c1d8869133e8881e1",
    order: "64a1713c1d8869133e8881a1",
    token: "tok_1234567890abcdef",
    qrCode: "qr_1234567890abcdef",
    amount: 120.5,
    currency: "BOB",
    status: "Pending",
  },
  {
    _id: "64a1713c1d8869133e8881e2",
    order: "64a1713c1d8869133e8881a2",
    token: "tok_abcdef1234567890",
    qrCode: "qr_abcdef1234567890",
    amount: 300,
    currency: "BOB",
    status: "Completed",
  },
  {
    _id: "64a1713c1d8869133e8881e3",
    order: "64a1713c1d8869133e8881a3",
    token: "tok_9876543210fedcba",
    qrCode: "qr_9876543210fedcba",
    amount: 75,
    currency: "BOB",
    status: "Failed",
  },
  {
    _id: "64a1713c1d8869133e8881e4",
    order: "64a1713c1d8869133e8881a4",
    token: "tok_asdfgh123456",
    qrCode: "qr_asdfgh123456",
    amount: 999.99,
    currency: "BOB",
    status: "Completed",
  },
  {
    _id: "64a1713c1d8869133e8881e5",
    order: "64a1713c1d8869133e8881a5",
    token: "tok_qwerty09876",
    qrCode: "qr_qwerty09876",
    amount: 45.25,
    currency: "BOB",
    status: "Pending",
  },
];

module.exports = payments;
