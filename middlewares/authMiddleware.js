import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import ApiError from "../utils/ApiError.js";
import { JWT_SECRET } from "../config/config.js";

export const protect = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return next(new ApiError(401, "Not authorized, no token"));

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) return next(new ApiError(401, "Invalid token"));

    const user = await User.findById(decoded.id).select(
      "_id username email role"
    );
    if (!user) return next(new ApiError(401, "User not found"));

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return next(new ApiError(401, "Token expired"));
    if (error.name === "JsonWebTokenError")
      return next(new ApiError(401, "Invalid token"));
    return next(new ApiError(500, `Server error: ${error.message}`));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return next(new ApiError(403, "Access denied, admin only"));
  }
};
