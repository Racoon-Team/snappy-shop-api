const bcrypt = require("bcryptjs");
const admins = [
  {
    name: {
      en: "Admin",
    },
    image: "https://i.ibb.co/WpM5yZZ/9.png",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "360-943-7332",
    role: "Super Admin",
    joiningData: new Date(),
    access_list: [
      "dashboard",
      "products",
      "product",
      "categories",
      "attributes",
      "coupons",
      "orders",
      "order",
      "our-staff",
      "settings",
      "languages",
      "currencies",
      "store",
      "customization",
      "store-settings",
      "notifications",
      "edit-profile",
      "coming-soon",
      "customers",
      "customer-order",
    ],
  },
];

module.exports = admins;
