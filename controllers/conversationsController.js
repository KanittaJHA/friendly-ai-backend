import Conversation from "../models/Conversations.js";
import ApiError from "../utils/ApiError.js";
import validator from "validator";

const sanitizeMessage = (text) => validator.escape(text.trim());

/* ---------------------- User Functions ---------------------- */

// @desc Create a new conversation (start a new chat)
// @route POST /friendly-api/v1/conversations
// @access Private (user)
export const createConversation = async (req, res, next) => {
  try {
    const { messages = [] } = req.body;
    if (!Array.isArray(messages)) {
      return next(new ApiError(400, "Messages must be an array"));
    }

    const sanitizedMessages = messages.map((msg) => ({
      role: msg.role === "ai" ? "ai" : "user",
      content: sanitizeMessage(msg.content || ""),
    }));

    const conversation = await Conversation.create({
      userId: req.user._id,
      messages: sanitizedMessages,
    });

    await conversation.populate("userId", "username email");
    res.status(201).json(conversation);
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
    if (!content || !content.trim()) {
      return next(new ApiError(400, "Message content cannot be empty"));
    }

    const conversation = await Conversation.findById(req.params.id).populate(
      "userId",
      "username email"
    );
    if (!conversation) return next(new ApiError(404, "Conversation not found"));

    if (
      conversation.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new ApiError(403, "Forbidden"));
    }

    const sanitizedContent = sanitizeMessage(content);
    conversation.messages.push({ role: "user", content: sanitizedContent });

    // AI response placeholder
    const aiResponse = sanitizeMessage(`AI response for: ${sanitizedContent}`);
    conversation.messages.push({ role: "ai", content: aiResponse });

    await conversation.save();
    res.status(200).json(conversation.messages);
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
    ) {
      return next(new ApiError(403, "Forbidden"));
    }

    const response = {
      ...conversation.toObject(),
      messageCount: conversation.messages.length,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc Get all conversations for user (paginated + search)
// @route GET /friendly-api/v1/conversations
// @access Private (user)
export const getUserConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search = "" } = req.query;

    let query = { userId: req.user._id };
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

    res
      .status(200)
      .json({ page, limit, total, conversations: conversationsWithCount });
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

    if (conversation.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "Forbidden"));
    }

    await conversation.remove();
    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/* ---------------------- Admin Functions ---------------------- */

// @desc Get all conversations (admin only, paginated)
// @route GET /friendly-api/v1/admin/conversations
// @access Private (admin)
export const getAllConversations = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ApiError(403, "Forbidden"));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Conversation.countDocuments();
    const conversations = await Conversation.find()
      .populate("userId", "username email")
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);

    const conversationsWithCount = conversations.map((conv) => ({
      ...conv.toObject(),
      messageCount: conv.messages.length,
    }));

    res
      .status(200)
      .json({ page, limit, total, conversations: conversationsWithCount });
  } catch (error) {
    next(error);
  }
};
