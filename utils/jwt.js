import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: "7d",
  });
};
