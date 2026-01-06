const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      default: null,
    },
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["inbound", "outbound"],
      default: "inbound",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Stock", stockSchema);
