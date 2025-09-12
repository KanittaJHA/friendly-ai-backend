import User from "../models/Users.js";
import ApiError from "../utils/ApiError.js";

//  @desc Get all users (admin only)
//  @route GET /friendly-api/v1/users
//  @access Private (admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: "success",
      page: Number(page),
      limit: Number(limit),
      total,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single user by ID (admin only)
// @route GET /friendly-api/v1/users/:id
// @access Private (admin)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return next(new ApiError(404, "User not found"));

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
