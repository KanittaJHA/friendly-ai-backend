import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { generateToken } from "../utils/jwt.js";
import ApiError from "../utils/ApiError.js";

// @desc Register a new user
// @route POST /friendly-api/v1/auth/register
// @access Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, adminInviteToken } = req.body;

    if (!username || !email || !password) {
      return next(new ApiError(400, "Please provide all fields"));
    }

    if (!validator.isEmail(email)) {
      return next(new ApiError(400, "Invalid email format"));
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
      })
    ) {
      return next(
        new ApiError(
          400,
          "Weak password. Must be at least 8 characters and include a number."
        )
      );
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(400, "User already exists"));
    }

    let role = "user";
    if (
      adminInviteToken &&
      adminInviteToken === process.env.ADMIN_INVITE_TOKEN
    ) {
      role = "admin";
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /friendly-api/v1/auth/login
// @access Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, "Email and password are required"));
    }

    if (!validator.isEmail(email)) {
      return next(new ApiError(400, "Invalid email format"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Logout user
// @route POST /friendly-api/v1/auth/logout
// @access Private
export const logoutUser = async (req, res, next) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};
