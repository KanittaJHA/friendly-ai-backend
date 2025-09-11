import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    isPublic: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    embedding: { type: [Number], default: [] },
    createdByAdmin: { type: Boolean, default: false },
    createdByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

knowledgeSchema.index({ title: "text", content: "text" });

export default mongoose.models.KnowledgeBase ||
  mongoose.model("KnowledgeBase", knowledgeSchema);
