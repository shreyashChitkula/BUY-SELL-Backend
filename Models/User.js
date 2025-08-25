const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the User schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*iiit\.ac\.in$/,
      "Only IIIT emails are allowed",
    ],
  },
  age: {
    type: Number,
    required: true,
    min: 1, // Assuming age must be a positive number
  },
  contactNumber: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Contact number must be 10 digits"], // Regex for 10-digit numbers
  },
  password: {
    type: String,
    required: true,
  },
  cartItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Refers to the Product model
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1, // Minimum quantity is 1
      },
    },
  ],
  sellerReviews: [
    {
      rating: {
        type: Number,
        min: 0,
        max: 5,
        required: true,
      },
      review: {
        type: String,
        trim: true,
      },
      reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Refers to another User who wrote the review
        required: true,
      },
    },
  ],
  profileImage: {
    type: String,
    required: true,
    default:
      "https://i.pinimg.com/564x/fe/4f/61/fe4f610344c0da3e261f76fe0ae1cdd6.jpg",
  },
});

// Pre-save middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is modified
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("Hashed Password from DB:", this.password);
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export the model
module.exports = mongoose.model("User", userSchema);
