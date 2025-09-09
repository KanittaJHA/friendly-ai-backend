import { Router } from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { getAllUsers, getUserById } from "../controllers/userController.js";

const router = Router();

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserById);

export default router;
