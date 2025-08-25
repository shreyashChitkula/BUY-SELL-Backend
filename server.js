const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRoutes = require("./Routes/userRoutes");
const productRoutes = require("./Routes/productRoutes");
const orderRoutes = require("./Routes/orderRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })
);
app.options("*", cors());
app.use(cookieParser());

app.use("/api/users", userRoutes); // Use the userRoutes for all routes starting with /api
app.use("/api/products", productRoutes); // Use the productRoutes for all routes starting with /api
app.use("/api/orders", orderRoutes);

// MongoDB connection
require("dotenv").config();
const dbURI = process.env.DB_URL;
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Route to set a cookie
app.get("/set-cookie", (req, res) => {
  // Set a cookie named "exampleCookie" with the value "HelloWorld"
  res.cookie("exampleCookie", "HelloWorld", {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: false, // Use 'true' in production (requires HTTPS)
    sameSite: "lax", // Controls cross-site behavior
    maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day in milliseconds)
  });

  res.send("Cookie has been set!");
});

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
