const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Import the User model
const Product = require("../Models/Product");
const getUserProfile = require("../utils/getUserProfile"); // Adjust the path as needed

const router = express.Router();
const JWT_SECRET = "my_secret_key"; // Use a strong secret key in production

// Cookie options for persistent token
const cookieOptions = {
  httpOnly: true, // Prevents JavaScript access to the cookie
  secure: process.env.NODE_ENV === "production", // Use secure cookies in production
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  sameSite: "strict", // Protects against CSRF
};

// Middleware to authenticate users using JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token)
    return res.status(401).json({ error: "Access denied, token missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // Add the user payload to the request
    next();
  });
};

// Route to create a new user (Signup)
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, age, contactNumber, password } =
      req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !age ||
      !contactNumber ||
      !password
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // // Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      age,
      contactNumber,
      password,
    });

    // Save the user to the database
    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token);
    const result = await getUserProfile(newUser._id);

    if (result.success) {
      res.status(200).json({
        message: "User profile retrieved successfully",
        user: result.user,
      });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the user" });
  }
});

// Route to log in a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find the user by email
    const newUser = await User.findOne({ email });
    if (!newUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await newUser.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.cookie("token", token);
    // res.cookie("token", "value");

    console.log("cookie set");

    try {
      const result = await getUserProfile(newUser._id);

      if (result.success) {
        res.status(200).json({
          message: "User profile retrieved successfully",
          user: result.user,
        });
      } else {
        res.status(404).json({ error: result.error });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while retrieving the profile" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// Route to log out a user
router.post("/logout", authenticateToken, (req, res) => {
  // Since JWTs are stateless, we cannot invalidate tokens on the server side directly.
  // Instead, you can handle logout by removing the token on the client-side or
  // implement a token blacklist (not shown here for simplicity).
  res.status(200).json({ message: "Logout successful" });
});

// Route to access protected user details (example of protected route)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    // const user = await User.findById(req.user.id)
    //   .populate({
    //     path: "sellerReviews.reviewerId",
    //     select: "firstName lastName profileImage",
    //   })
    //   .populate({
    //     path: "cartItems.product",
    //     select: "name price productImage",
    //   });

    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    // res.status(200).json({
    //   message: "User profile retrieved successfully",
    //   user: {
    //     id: user._id,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     email: user.email,
    //     age: user.age,
    //     contactNumber: user.contactNumber,
    //     profileImage: user.profileImage,
    //     sellerReviews: user.sellerReviews.map((review) => ({
    //       rating: review.rating,
    //       review: review.review,
    //       reviewerId: {
    //         id: review.reviewerId._id,
    //         firstName: review.reviewerId.firstName,
    //         lastName: review.reviewerId.lastName,
    //         email: review.reviewerId.email,
    //         profileImage: review.reviewerId.profileImage,
    //       },
    //     })),
    //     cartItems: user.cartItems.map((item) => ({
    //       product: {
    //         id: item.product._id,
    //         name: item.product.name,
    //         price: item.product.price,
    //         productImage: item.product.productImage,
    //       },
    //       quantity: item.quantity,
    //     })),
    //   },
    // });

    const result = await getUserProfile(req.user.id);

    if (result.success) {
      res.status(200).json({
        message: "User profile retrieved successfully",
        user: result.user,
      });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the profile" });
  }
});

router.get("/profile/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // const user = await User.findById(id)
    //   .populate({
    //     path: "sellerReviews.reviewerId",
    //     select: "firstName lastName profileImage",
    //   })
    //   .populate({
    //     path: "cartItems.product",
    //     select: "name price description",
    //   });

    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    // res.status(200).json({
    //   message: "User profile retrieved successfully",
    //   user: {
    //     id: user._id,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     email: user.email,
    //     age: user.age,
    //     contactNumber: user.contactNumber,
    //     profileImage: user.profileImage,
    //     sellerReviews: user.sellerReviews.map((review) => ({
    //       rating: review.rating,
    //       review: review.review,
    //       reviewerId: {
    //         id: review.reviewerId._id,
    //         firstName: review.reviewerId.firstName,
    //         lastName: review.reviewerId.lastName,
    //         email: review.reviewerId.email,
    //         profileImage: review.reviewerId.profileImage,
    //       },
    //     })),
    //     cartItems: user.cartItems.map((item) => ({
    //       product: {
    //         id: item.product._id,
    //         name: item.product.name,
    //         price: item.product.price,
    //         description: item.product.description,
    //       },
    //       quantity: item.quantity,
    //     })),
    //   },
    // });

    const result = await getUserProfile(id);

    if (result.success) {
      res.status(200).json({
        message: "User profile retrieved successfully",
        user: result.user,
      });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the profile" });
  }
});

// Route to update user info
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, age, contactNumber, profileImage } =
      req.body;

    // Validate input
    if (
      !firstName ||
      !lastName ||
      !email ||
      !age ||
      !contactNumber ||
      !profileImage
    ) {
      return res.status(400).json({
        error:
          "All fields (firstName, lastName, email, age, contactNumber) are required",
      });
    }

    // Find the user and update the information
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, // The ID from the authenticated token
      { firstName, lastName, email, age, contactNumber, profileImage }, // Fields to update
      { new: true, runValidators: true } // Options: return the updated document and validate
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User info updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        age: updatedUser.age,
        contactNumber: updatedUser.contactNumber,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating user info" });
  }
});

// Route to get seller reviews by user ID
// Route to get seller reviews by user ID
router.get("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user by ID in MongoDB
    const user = await User.findById(id);

    if (user) {
      // Return seller reviews
      res.status(200).json(user.sellerReviews);
    } else {
      // If user not found, return an error
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    // Handle any potential errors
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route to update seller reviews by user ID
router.post("/reviews/:id", async (req, res) => {
  const { rating, review, reviewerId } = req.body;

  // Validate the request body
  if (!reviewerId || rating === undefined || !review) {
    return res
      .status(400)
      .json({ error: "Invalid request body. Missing fields." });
  }

  try {
    // Find the user to whom the review is being added
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Append the new review
    const newReview = { rating, review, reviewerId };
    user.sellerReviews.push(newReview);
    await user.save();

    // Populate the reviewerId field with relevant details
    const populatedUser = await User.findById(req.params.id).populate({
      path: "sellerReviews.reviewerId",
      select: "firstName lastName profileImage",
    });

    res.status(200).json({
      message: "Review added successfully",
      sellerReviews: populatedUser.sellerReviews,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cart/add", authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.id);

    const existingCartItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity || 1;
    } else {
      const product = await Product.findById(productId);
      user.cartItems.push({
        product: productId,
        quantity: quantity || 1,
      });
    }

    await user.save();
    const updatedUser = await getUserProfile(req.user.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/cart/remove/:productId",
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== req.params.productId
      );
      await user.save();

      const updatedUser = await getUserProfile(req.user.id);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put("/cart/update-quantity", authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.id);

    const cartItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity = quantity;
      await user.save();

      const updatedUser = await getUserProfile(req.user.id);
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/cart", authenticateToken, async (req, res) => {
  try {
    const updatedUser = await getUserProfile(req.user.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
