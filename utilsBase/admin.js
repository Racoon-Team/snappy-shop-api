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
    role: "650a2b3c4d5e6f7890123451",
    joiningData: new Date(),
  },
];

module.exports = admins;
