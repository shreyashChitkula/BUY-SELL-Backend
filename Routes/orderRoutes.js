const express = require("express");
const router = express.Router();
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const User = require("../Models/User");
const crypto = require("crypto");

// Utility functions for OTP
const OTPUtils = {
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  },

  hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
  },

  compareOTP(inputOTP, hashedOTP) {
    return this.hashOTP(inputOTP) === hashedOTP;
  },
};

// Create a new order
router.post("/checkout", async (req, res) => {
  const { userId, products } = req.body;
  console.log("Checkout Request:", { userId, products });

  try {
    // Validate inputs
    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ error: "Invalid checkout parameters" });
    }

    const orderProducts = await Promise.all(
      products.map(async (productId) => {
        const product = await Product.findByIdAndUpdate(
          productId,
          { tradingStatus: "sold" },
          { new: true }
        );

        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }
        const otp = OTPUtils.generateOTP();
        const hashedOTP = OTPUtils.hashOTP(otp);

        return {
          product: productId,
          otp: hashedOTP,
          status: "in process",
          originalOTP: otp,
        };
      })
    );
    const order = new Order({
      user: userId,
      products: orderProducts.map((p) => ({
        product: p.product,
        otp: p.otp,
        status: p.status,
      })),
    });
    await order.save();

    // Clear the user's cart
    await User.findByIdAndUpdate(userId, { cartItems: [] });

    res.status(201).json(order);
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
});
//verify the otp
router.post("/verify-otp", async (req, res) => {
  const { productId, otp } = req.body;

  try {
    const order = await Order.findOne({
      "products.product": productId,
    });

    if (!order) {
      return res.status(400).json({ error: "Invalid Order" });
    }

    const product = order.products.find(
      (p) => p.product.toString() === productId
    );

    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }

    // Verify OTP
    if (OTPUtils.compareOTP(otp, product.otp)) {
      product.status = "completed";
      await order.save();
      res.status(200).json({ message: "OTP verified and order completed" });
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Fetch deliveries for a user
router.get("/deliveries/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({
      "products.product": { $exists: true },
      "products.status": "in process",
    })
      .populate("products.product")
      .populate(
        "user",
        "firstName lastName profileImage email contactNumber age"
      );

    const deliveries = orders.flatMap((order) =>
      order.products
        .filter(
          (product) =>
            product.product.seller.toString() === userId &&
            product.status === "in process"
        )
        .map((product) => {
          const productObj = product.toObject();
          delete productObj.otp;
          return {
            ...productObj,
            buyer: order.user,
          };
        })
    );

    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

// Fetch active orders for a user
router.get("/active-orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({
      user: userId,
      "products.status": "in process", // Existing status filter
    }).populate({
      path: "products.product",
      populate: {
        path: "seller",
        select: "firstName lastName profileImage email contactNumber age",
      },
    });
    const activeOrders = await Promise.all(
      orders.flatMap((order) =>
        order.products
          .filter((product) => product.status === "in process")
          .map(async (product) => {
            const productObj = product.toObject();

            // Generate new OTP
            const newOTP = OTPUtils.generateOTP();
            const hashedOTP = OTPUtils.hashOTP(newOTP);

            // Update the product's OTP in the database
            await Order.updateOne(
              {
                _id: order._id,
                "products.product": productObj.product,
              },
              {
                $set: { "products.$.otp": hashedOTP },
              }
            );

            return {
              ...productObj,
              otp: newOTP,
              seller: product.product.seller,
            };
          })
      )
    );

    res.status(200).json(activeOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active orders" });
  }
});

module.exports = router;
