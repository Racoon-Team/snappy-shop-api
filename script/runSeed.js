require("dotenv").config();
const { connectDB } = require("../config/db");

const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");
const Language = require("../models/Language");
const Currency = require("../models/Currency");
const Attribute = require("../models/Attribute");
const Setting = require("../models/Setting");
const Payment = require("../models/Payment");
const Stock = require("../models/Stock");
const Role = require("../models/Role");

async function runSeed(sourcePath) {
  connectDB();

  const adminData = require(`../utilsBase/admin`);
  const customerData = require(`../utilsBase/customers`);
  const couponData = require(`../utilsBase/coupon`);
  const productData = require(`../utilsBase/products`);
  const orderData = require(`../${sourcePath}/orders`);
  const categoryData = require(`../utilsBase/categories`);
  const languageData = require(`../utilsBase/language`);
  const currencyData = require(`../utilsBase/currency`);
  const attributeData = require(`../utilsBase/attributes`);
  const settingData = require(`../utilsBase/settings`);
  const paymentData = require(`../utilsBase/payments`);
  const stockData = require(`../utilsBase/stocks`);
  const roleData = require(`../${sourcePath}/roles`);

  try {
    await Language.deleteMany();
    await Language.insertMany(languageData);

    await Currency.deleteMany();
    await Currency.insertMany(currencyData);

    await Attribute.deleteMany();
    await Attribute.insertMany(attributeData);

    await Customer.deleteMany();
    await Customer.insertMany(customerData);

    await Admin.deleteMany();
    await Admin.insertMany(adminData);

    await Category.deleteMany();
    await Category.insertMany(categoryData);

    await Product.deleteMany();
    await Product.insertMany(productData);

    await Coupon.deleteMany();
    await Coupon.insertMany(couponData);

    await Order.deleteMany();
    await Order.insertMany(orderData);

    await Setting.deleteMany();
    await Setting.insertMany(settingData);

    await Payment.deleteMany();
    await Payment.insertMany(paymentData);

    await Stock.deleteMany();
    await Stock.insertMany(stockData);

    await Role.deleteMany();
    await Role.insertMany(roleData);

    console.log(`Data from "${sourcePath}" inserted successfully!`);
    process.exit();
  } catch (error) {
    console.error("error", error);
    process.exit(1);
  }
}

module.exports = runSeed;
