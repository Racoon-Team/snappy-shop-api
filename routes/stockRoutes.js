const express = require("express");
const router = express.Router();

const {
  addStock,
  getAllStocks,
  getStockById,
  getStocksByProductId,
  getStockTotals,
} = require("../controller/stockController");

router.get("/product/:id", getStocksByProductId);

router.get("/totals/:productId", getStockTotals);

router.post("/add", addStock);

router.get("/", getAllStocks);

router.get("/:id", getStockById);

module.exports = router;
