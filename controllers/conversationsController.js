import Conversation from "../models/Conversations.js";
import KnowledgeBase from "../models/KnowledgeBase.js";
import ApiError from "../utils/ApiError.js";
import validator from "validator";

import { queryLLM } from "../utils/mistralClient.js";
import { getEmbedding } from "../utils/mistralClient.js";
import { findRelevantDocs } from "../services/ragService.js";

const sanitizeMessage = (text) => validator.escape(text.trim());
const sanitizeTitle = (text) => validator.escape(text.trim().substring(0, 100));

// @desc Create a new conversation (start a new chat)
// @route POST /friendly-api/v1/conversations
// @access Private (user)
export const createConversation = async (req, res, next) => {
  try {
    let { messages = [] } = req.body;

    if (!Array.isArray(messages)) {
      if (typeof messages === "string") messages = [{ content: messages }];
      else
        return next(new ApiError(400, "Messages must be an array or string"));
    }

    const conversationMessages = [];

    for (const msg of messages) {
      const userContent = sanitizeMessage(msg.content || "");
      conversationMessages.push({ role: "user", content: userContent });

      const docs = await findRelevantDocs(userContent, 5);
      const contextText = docs
        .map(
          (d, i) =>
            `Knowledge ${i + 1}:\nTitle: ${d.title}\nContent: ${d.content}`
        )
        .join("\n\n");

      const prompt = `You are an AI assistant. Use the following knowledge to answer clearly:\n${contextText}\nUser Question: ${userContent}\nAnswer:`;

      const aiContent = await queryLLM(prompt);
      conversationMessages.push({ role: "ai", content: aiContent });

      await KnowledgeBase.create({
        title: sanitizeTitle(userContent),
        content: aiContent,
        isPublic: false,
        tags: [],
        embedding: await getEmbedding(aiContent),
      });
    }

    const conversation = await Conversation.create({
      userId: req.user._id,
      messages: conversationMessages,
    });

    await conversation.populate("userId", "username email");

    res.status(201).json({
      status: "success",
      data: {
        conversationId: conversation._id,
        messages: conversation.messages,
      },
      message: "Conversation created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Send a message in a conversation and get AI response
// @route POST /friendly-api/v1/conversations/:id/messages
// @access Private (user)
export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return next(new ApiError(404, "Conversation not found"));

    const userContent = sanitizeMessage(content);
    conversation.messages.push({ role: "user", content: userContent });
    await conversation.save();

    const relevantDocs = await findRelevantDocs(userContent, 3);
    let context = "";
    if (relevantDocs.length > 0) {
      context =
        "\nHere is some relevant knowledge:\n" +
        relevantDocs.map((d) => `- ${d.content}`).join("\n");
    }

    const prompt = `User asked: "${userContent}"\n${context}\nAnswer in a helpful way.`;
    const aiResponse = await queryLLM(prompt);

    conversation.messages.push({ role: "ai", content: aiResponse });
    await conversation.save();

    const embedding = await getEmbedding(userContent);
    await KnowledgeBase.create({
      title: sanitizeTitle(userContent),
      content: aiResponse,
      tags: ["auto"],
      isApproved: false,
      embedding,
    });

    res.status(200).json({
      status: "success",
      data: { response: aiResponse },
      message: "Message sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get conversation by ID (user can see own, admin can see all)
// @route GET /friendly-api/v1/conversations/:id
// @access Private
export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "userId",
      "username email"
    );
    if (!conversation) return next(new ApiError(404, "Conversation not found"));

    if (
      conversation.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return next(new ApiError(403, "Forbidden"));

    res.status(200).json({
      status: "success",
      data: {
        ...conversation.toObject(),
        messageCount: conversation.messages.length,
      },
      message: "Conversation retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get conversations for user (paginated + search)
// @route GET /friendly-api/v1/conversations?page=1&limit=10
// @route GET /friendly-api/v1/conversations?search=AI&mode=search&page=1&limit=10
// @access Private (user)
export const getUserConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search = "", mode = "full" } = req.query;

    let query = { userId: req.user._id };

    let conversations, total;

    if (search && mode === "search") {
      query["messages"] = {
        $elemMatch: { content: { $regex: search, $options: "i" } },
      };

      total = await Conversation.countDocuments(query);

      if (total === 0) {
        return next(
          new ApiError(404, "No conversations found matching search criteria")
        );
      }

      conversations = await Conversation.find(query)
        .populate("userId", "username email")
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit);

      conversations = conversations.map((conv) => {
        const matchedMessages = conv.messages.filter((msg) =>
          msg.content.match(new RegExp(search, "i"))
        );
        return {
          ...conv.toObject(),
          messages: matchedMessages,
          messageCount: matchedMessages.length,
        };
      });
    } else {
      total = await Conversation.countDocuments(query);

      if (total === 0) {
        return next(new ApiError(404, "No conversations found for this user"));
      }

      conversations = await Conversation.find(query)
        .populate("userId", "username email")
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit);

      conversations = conversations.map((conv) => ({
        ...conv.toObject(),
        messageCount: conv.messages.length,
      }));
    }

    res.status(200).json({
      status: "success",
      data: {
        page,
        limit,
        total,
        conversations,
      },
      message: "User conversations retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete a conversation (user only)
// @route DELETE /friendly-api/v1/conversations/:id
// @access Private (user)
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return next(new ApiError(404, "Conversation not found"));

    if (conversation.userId.toString() !== req.user._id.toString())
      return next(new ApiError(403, "Forbidden"));

    await conversation.deleteOne();
    res.status(200).json({
      status: "success",
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all conversations (admin only, paginated)
// @route GET /friendly-api/v1/conversations/admin/all
// @access Private (admin)
export const getAllConversations = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return next(new ApiError(403, "Forbidden"));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search = "" } = req.query;

    let query = {};
    if (search) query["messages.content"] = { $regex: search, $options: "i" };

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .populate("userId", "username email")
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);

    const conversationsWithCount = conversations.map((conv) => ({
      ...conv.toObject(),
      messageCount: conv.messages.length,
    }));

    res.status(200).json({
      status: "success",
      data: {
        page,
        limit,
        total,
        conversations: conversationsWithCount,
      },
      message: "All conversations retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};
