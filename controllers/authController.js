import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";
import { generateToken, setTokenCookie } from "../utils/jwt.js";
import ApiError from "../utils/ApiError.js";
import { ADMIN_INVITE_TOKEN } from "../config/config.js";
import { generateCsrfToken } from "../utils/generateSecretKey.js";

// sanitize username
const sanitizeUsername = (username) => validator.escape(username.trim());

// @desc Register a new user
// @route POST /friendly-api/v1/auth/register
// @access Public
export const registerUser = async (req, res, next) => {
  try {
    let { username, email, password, adminInviteToken } = req.body;

    if (!username || !email || !password)
      return next(new ApiError(400, "Please provide all fields"));

    username = sanitizeUsername(username);

    if (!validator.isEmail(email))
      return next(new ApiError(400, "Invalid email format"));

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
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
    if (userExists) return next(new ApiError(400, "User already exists"));

    let role = "user";
    if (adminInviteToken && adminInviteToken === ADMIN_INVITE_TOKEN) {
      role = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    const csrfToken = generateCsrfToken();
    res.cookie("csrfToken", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: "success",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        csrfToken,
        ...(process.env.NODE_ENV !== "production" && { token }),
      },
      message: "User registered successfully",
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
    if (!email || !password)
      return next(new ApiError(400, "Email and password are required"));

    if (!validator.isEmail(email))
      return next(new ApiError(400, "Invalid email format"));

    const user = await User.findOne({ email });
    if (!user) return next(new ApiError(401, "Invalid email or password"));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new ApiError(401, "Invalid email or password"));

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    const csrfToken = generateCsrfToken();
    res.cookie("csrfToken", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        csrfToken,
        ...(process.env.NODE_ENV !== "production" && { token }),
      },
      message: "Login successful",
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
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("csrfToken", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({ status: "success", message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user info
// @route   GET /friendly-api/v1/auth/me
// @access  Private (any logged-in user)
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) return next(new ApiError(401, "Not authorized"));

    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
