import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { verifyCsrf } from "../middlewares/csrfMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, verifyCsrf, logoutUser);
router.get("/me", protect, getMe);

export default router;
