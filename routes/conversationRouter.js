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
// import { verifyCsrf } from "../middlewares/csrfMiddleware.js";

const router = Router();

router.post("/", protect, createConversation);
router.post("/:id/messages", protect, sendMessage);
router.delete("/:id", protect, deleteConversation);

router.get("/:id", protect, getConversationById);
router.get("/", protect, getUserConversations);

router.get("/admin/all", protect, adminOnly, getAllConversations);

export default router;
