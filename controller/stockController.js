const mongoose = require("mongoose");
const Stock = require("../models/Stock");
const Product = require("../models/Product");

const addStock = async (req, res) => {
  try {
    const { productId, quantity, type } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    }

    const product = await Product.findById(productId).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newStock = new Stock({
      productId: product._id,
      productName: product.title.en,
      category: product.category?.name?.en || "",
      quantity: Math.abs(quantity),
      type: type === "outbound" ? "outbound" : "inbound",
    });

    await newStock.save();

    res.status(201).json({
      message: `Stock ${type || "inbound"} registered successfully`,
      stock: newStock,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering stock", error });
  }
};

const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getStocksByProductId = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const stocks = await Stock.find({ productId }).sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getStockTotals = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Stock.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$quantity" },
        },
      },
    ]);

    const inbound = result.find((r) => r._id === "inbound")?.total || 0;
    const outbound = result.find((r) => r._id === "outbound")?.total || 0;

    res.json({
      inbound,
      outbound,
      stockTotal: inbound - outbound,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addStock,
  getAllStocks,
  getStockById,
  getStocksByProductId,
  getStockTotals,
};
