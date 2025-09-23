require("dotenv").config();
const { connectDB } = require("../config/db");

const Admin = require("../models/Admin");
const adminData = require("../utilsBase/admin");

const Customer = require("../models/Customer");
const customerData = require("../utilsBase/customers");

const Coupon = require("../models/Coupon");
const couponData = require("../utilsBase/coupon");

const Product = require("../models/Product");
const productData = require("../utilsBase/products");

const Order = require("../models/Order");
const orderData = require("../utilsBase/orders");

const Category = require("../models/Category");
const categoryData = require("../utilsBase/categories");

const Language = require("../models/Language");
const languageData = require("../utilsBase/language");

const Currency = require("../models/Currency");
const currencyData = require("../utilsBase/currency");

const Attribute = require("../models/Attribute");
const attributeData = require("../utilsBase/attributes");

const Setting = require("../models/Setting");
const settingData = require("../utilsBase/settings");

const Payment = require("../models/Payment");
const paymentData = require("../utilsBase/payments");

const Stock = require("../models/Stock");
const stockData = require("../utilsBase/stocks");

connectDB();
const importData = async () => {
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

    console.log("data inserted successfully!");
    process.exit();
  } catch (error) {
    console.log("error", error);
    process.exit(1);
  }
};

importData();
