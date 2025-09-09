import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getAllConversations,
  getConversationById,
  getUserConversations,
  sendMessage,
} from "../controllers/conversationsController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", protect, createConversation);
router.post("/:id/messages", protect, sendMessage);
router.get("/:id", protect, getConversationById);
router.get("/", protect, getUserConversations);
router.delete("/:id", protect, deleteConversation);

router.get("/admin/all", protect, adminOnly, getAllConversations);

export default router;
