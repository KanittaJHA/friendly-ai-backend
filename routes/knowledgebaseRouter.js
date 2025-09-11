import { Router } from "express";
import {
  addKnowledge,
  deleteKnowledge,
  getKnowledge,
  updateKnowledge,
  approveKnowledge,
} from "../controllers/knowledgeBaseControllers.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", protect, adminOnly, addKnowledge);
router.put("/:id", protect, adminOnly, updateKnowledge);
router.delete("/:id", protect, adminOnly, deleteKnowledge);
router.get("/", protect, getKnowledge);
router.patch("/:id/approve", protect, adminOnly, approveKnowledge);

export default router;
