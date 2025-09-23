const bcrypt = require("bcryptjs");

const customers = [
  {
    _id: "6439713c1d8869133e8881e9",

    name: "Justin J. Ruiz",
    email: "justin@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "212-512-2888",
  },
];
module.exports = customers;
