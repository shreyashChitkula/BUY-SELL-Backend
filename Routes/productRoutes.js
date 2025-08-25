const express = require("express");
const router = express.Router();
const User = require("../Models/User.js");
const Product = require("../Models/Product.js");
const Order = require("../Models/Order.js");

// Get all products
router.get("/allProducts", async (req, res) => {
  try {
    const products = await Product.find();
    const listedProducts = products.filter(
      (product) => product.tradingStatus === "available"
    );
    res.status(200).json(listedProducts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the product" });
  }
});

// Get a single product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the product" });
  }
});

// Get all products listed by a specific user
router.get("/listProducts/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Find all products where the seller field matches the provided user ID
    const products = await Product.find({ seller: userId });

    // Categorize products
    const listedProducts = products.filter(
      (product) => product.tradingStatus === "available"
    );
    const soldItems = products.filter(
      (product) => product.tradingStatus === "sold"
    );

    // Find all orders where the user is the buyer
    const orders = await Order.find({ user: userId }).populate(
      "products.product"
    );
    const orderedItems = orders.flatMap((order) =>
      order.products.map((p) => p.product)
    );

    res.json({ listedProducts, soldItems, orderedItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new product
router.post("/product", async (req, res) => {
  const { name, description, price, productImage, category, sellerId } =
    req.body;

  try {
    // Find the seller (User) by their ID
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    // Create a new product with the seller's info
    const newProduct = new Product({
      name,
      description,
      price,
      productImage,
      category,
      seller: sellerId, // Reference the seller by ID
      sellerImage: seller.profileImage, // Use the seller's profile image
    });

    const savedProduct = await newProduct.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to create product", details: error.message });
  }
});

// Update a product by ID
router.put("/products/:id", async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // `new` returns the updated document, `runValidators` validates input
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update product", details: error.message });
  }
});

// Delete a product by ID
router.delete("/products/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete the product" });
  }
});

module.exports = router;
