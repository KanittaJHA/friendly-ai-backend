import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRouter from "./userRouter.js";
import conversationRouter from "./conversationRouter.js";
import knowledgebaseRouter from "./knowledgebaseRouter.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRouter);
router.use("/conversations", conversationRouter);
router.use("/knowledgebase", knowledgebaseRouter);

export default router;
