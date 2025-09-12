import { Router } from "express";
import {
  addKnowledge,
  deleteKnowledge,
  getKnowledge,
  updateKnowledge,
  approveKnowledge,
} from "../controllers/knowledgeBaseControllers.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { verifyCsrf } from "../middlewares/csrfMiddleware.js";

const router = Router();

router.post("/", protect, verifyCsrf, adminOnly, addKnowledge);
router.put("/:id", protect, verifyCsrf, adminOnly, updateKnowledge);
router.delete("/:id", protect, verifyCsrf, adminOnly, deleteKnowledge);
router.patch("/:id/approve", protect, verifyCsrf, adminOnly, approveKnowledge);

router.get("/", protect, getKnowledge);

export default router;
