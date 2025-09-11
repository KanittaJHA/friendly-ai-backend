import mongoose from "mongoose";
import KnowledgeBase from "../models/KnowledgeBase.js";
import { MONGO_URL } from "./config.js";

const fixKnowledgeBaseIndexes = async () => {
  try {
    await KnowledgeBase.collection.dropIndexes();
    await KnowledgeBase.syncIndexes();
    console.log("KnowledgeBase indexes synced successfully");
  } catch (error) {
    if (error.code === 26) {
      await KnowledgeBase.syncIndexes();
      console.log("KnowledgeBase indexes created");
    } else {
      console.error("Error fixing KnowledgeBase indexes:", error);
    }
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {});
    console.log("MongoDB Connected");

    await fixKnowledgeBaseIndexes();
  } catch (err) {
    console.log("Error connecting to MongoDB", err);
    process.exit(1);
  }
};

export default connectDB;
