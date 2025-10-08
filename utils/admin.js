const bcrypt = require("bcryptjs");

const admins = [
  {
    name: { en: "Alice B. Porter" },
    image: "https://i.ibb.co/m5B0hK4/team-8.jpg",
    email: "alice@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "708-488-9728",
    role: "650a2b3c4d5e6f7890123452",
    joiningData: new Date(),
  },
  {
    name: { en: "Corrie H. Cates" },
    image: "https://i.ibb.co/SNN7JCX/team-6.jpg",
    email: "corrie@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "914-623-6873",
    role: "650a2b3c4d5e6f7890123453",
    joiningData: new Date(),
  },
  {
    name: { en: "Shawn E. Palmer" },
    image: "https://i.ibb.co/GWVWYNn/team-7.jpg",
    email: "shawn@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "949-202-2913",
    role: "650a2b3c4d5e6f7890123454",
    joiningData: new Date(),
  },
  {
    name: { en: "Admin" },
    image: "https://i.ibb.co/WpM5yZZ/9.png",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("12345678"),
    phone: "360-943-7332",
    role: "650a2b3c4d5e6f7890123451",
    joiningData: new Date(),
  },
];

module.exports = admins;
