const User = require("../Models/User"); // Import the User model
// Utility function to retrieve user profile with populated fields
const getUserProfile = async (userId) => {
  try {
    // Find the user by ID and populate related fields
    const user = await User.findById(userId)
      .populate({
        path: "sellerReviews.reviewerId",
        select: "firstName lastName profileImage email",
      })
      .populate({
        path: "cartItems.product",
        select: "name price productImage tradingStatus",
      });

    if (!user) {
      throw new Error("User not found");
    }

    // Format the user object to include only the required fields
    const formattedUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      age: user.age,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
      sellerReviews: user.sellerReviews.map((review) => ({
        rating: review.rating,
        review: review.review,
        reviewerId: {
          id: review.reviewerId._id,
          firstName: review.reviewerId.firstName,
          lastName: review.reviewerId.lastName,
          email: review.reviewerId.email,
          profileImage: review.reviewerId.profileImage,
        },
      })),
      cartItems: user.cartItems.map((item) => ({
        product: {
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          description: item.product.description,
          productImage: item.product.productImage,
          tradingStatus: item.product.tradingStatus,
        },
        quantity: item.quantity,
      })),
    };

    return { success: true, user: formattedUser };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

module.exports = getUserProfile;
