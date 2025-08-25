const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    content: {
      type: String,
      required: true,
    },
  },
  price: { type: Number, required: true, default: 0 },
  productImage: [
    {
      URL: { type: String, required: true },
      alt: { type: String, required: true },
    },
  ],
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Refers to the Product model
    required: true,
    default: "Anonymous",
  },
  sellerImage: {
    type: String,
    required: true,
  },
  tradingStatus: {
    type: String,
    enum: ["available", "sold"],
    default: "available",
  },
  otp: { type: String, default: "" },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
