const coupons = [
  {
    status: "show",
    title: {
      en: "Summer Gift Voucher",
      es: "Cupón de regalo de verano",
    },
    couponCode: "SUMMER26",
    endTime: "2026-10-18T20:38:00.000Z",
    minimumAmount: 500,
    productType: "Grocery",
    logo: "https://i.ibb.co/23kQcB9/ins3.jpg",
    discountType: {
      type: "percentage",
      value: 10,
    },
  },

  {
    status: "show",
    title: {
      en: "Winter Gift Voucher",
      es: "Cupón de regalo de invierno",
    },
    couponCode: "WINTER25",
    endTime: "2025-05-31T20:19:00.000Z",
    minimumAmount: 1500,
    productType: "Grocery",
    logo: "https://i.ibb.co/wBBYm7j/ins4.jpg",
    discountType: {
      type: "fixed",
      value: 100,
    },
  },

  {
    status: "show",
    title: {
      en: "Summer Gift Voucher",
      es: "Cupón de regalo de verano",
    },
    couponCode: "SUMMER24",
    endTime: "2024-12-20T00:56:00.000Z",
    minimumAmount: 1000,
    productType: "Cloths",
    logo: "https://i.ibb.co/4thS4Z1/ins2.jpg",
    discountType: {
      type: "percentage",
      value: 10,
    },
  },
  {
    status: "show",
    title: {
      en: "August Gift Voucher",
      es: "Cupón de regalo de agosto",
    },
    couponCode: "AUGUST24",
    endTime: "2024-10-31T08:30:00.000Z",
    minimumAmount: 2000,
    productType: "Grocery",
    logo: "https://i.ibb.co/PDLPDHc/ins1.jpg",
    discountType: {
      type: "percentage",
      value: 50,
    },
  },
];
module.exports = coupons;
