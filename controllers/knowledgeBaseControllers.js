// File: controllers/knowledgeBaseControllers.js

import KnowledgeBase from "../models/KnowledgeBase.js";
import ApiError from "../utils/ApiError.js";
import validator from "validator";
import { getEmbedding } from "../utils/mistralClient.js";

/**
 * Sanitize & validate input
 */
const sanitizeAndValidate = (text, fieldName) => {
  if (!text || !text.trim())
    throw new ApiError(400, `${fieldName} is required`);
  return validator.escape(text.trim());
};

/* ---------------------- Admin Functions ---------------------- */

// @desc Add new knowledge (Admin)
// @route POST /friendly-api/v1/knowledgebase
// @access Private (admin)
export const addKnowledge = async (req, res, next) => {
  try {
    let { title, content, tags = [] } = req.body;

    // sanitize + validate
    title = sanitizeAndValidate(title, "Title");
    content = sanitizeAndValidate(content, "Content");
    tags = Array.isArray(tags) ? tags.map((t) => validator.escape(t)) : [];

    const isAdmin = req.user.role === "admin";
    const embedding = await getEmbedding(content);

    const knowledge = await KnowledgeBase.create({
      title,
      content,
      tags,
      embedding,
      isPublic: isAdmin,
      isApproved: isAdmin,
      createdByAdmin: isAdmin,
      createdByUser: !isAdmin,
    });

    res.status(201).json({
      status: "success",
      data: knowledge,
      message: "Knowledge added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all knowledge with optional search & pagination
// @route GET /friendly-api/v1/knowledgebase
// @access Private (user/admin)
export const getKnowledge = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // user sees only approved + public
    if (req.user.role === "user") {
      query.isPublic = true;
      query.isApproved = true;
    }

    if (search) {
      if (req.user.role === "admin") {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      } else {
        query.$text = { $search: search };
      }
    }

    const total = await KnowledgeBase.countDocuments(query);
    const knowledgeList = await KnowledgeBase.find(query, {
      title: 1,
      content: 1,
      tags: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      status: "success",
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: knowledgeList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update knowledge by ID (Admin)
// @route PUT /friendly-api/v1/knowledgebase/:id
// @access Private (admin)
export const updateKnowledge = async (req, res, next) => {
  try {
    const { title, content, tags, isPublic } = req.body;

    const knowledge = await KnowledgeBase.findById(req.params.id);
    if (!knowledge) return next(new ApiError(404, "Knowledge not found"));

    // sanitize input
    if (title) knowledge.title = sanitizeAndValidate(title, "Title");
    if (content) {
      knowledge.content = sanitizeAndValidate(content, "Content");
      knowledge.embedding = await getEmbedding(knowledge.content);
    }
    if (tags)
      knowledge.tags = Array.isArray(tags)
        ? tags.map((t) => validator.escape(t))
        : [];
    if (typeof isPublic === "boolean") knowledge.isPublic = isPublic;

    await knowledge.save();

    res.status(200).json({
      status: "success",
      data: knowledge,
      message: "Knowledge updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Approve knowledge (make it public)
// @route PATCH /friendly-api/v1/knowledgebase/:id/approve
// @access Private (admin)
export const approveKnowledge = async (req, res, next) => {
  try {
    const knowledge = await KnowledgeBase.findById(req.params.id);
    if (!knowledge) return next(new ApiError(404, "Knowledge not found"));

    knowledge.isApproved = true;
    knowledge.isPublic = true;
    await knowledge.save();

    res.status(200).json({
      status: "success",
      data: knowledge,
      message: "Knowledge approved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete knowledge by ID (Admin)
// @route DELETE /friendly-api/v1/knowledgebase/:id
// @access Private (admin)
export const deleteKnowledge = async (req, res, next) => {
  try {
    const knowledge = await KnowledgeBase.findById(req.params.id);
    if (!knowledge) return next(new ApiError(404, "Knowledge not found"));

    await knowledge.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Knowledge deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
