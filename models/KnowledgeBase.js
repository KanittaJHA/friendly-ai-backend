import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

knowledgeSchema.index({ title: "text", content: "text" });

export default mongoose.models.KnowledgeBase ||
  mongoose.model("KnowledgeBase", knowledgeSchema);
