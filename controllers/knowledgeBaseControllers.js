import KnowledgeBase from "../models/KnowledgeBase.js";
import ApiError from "../utils/ApiError.js";

// @desc Add new knowledge (Admin)
// @route POST /knowledgebase
// @access Private (admin)
export const addKnowledge = async (req, res, next) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return next(new ApiError(400, "Title and content are required"));
    }

    const knowledge = await KnowledgeBase.create({ title, content, tags });
    res.status(201).json(knowledge);
  } catch (error) {
    next(error);
  }
};

// @desc Get all knowledge with optional search & pagination
// @route GET /knowledgebase
// @access Private (user/admin)
export const getKnowledge = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role === "user") {
      query.isPublic = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const total = await KnowledgeBase.countDocuments(query);
    const knowledgeList = await KnowledgeBase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      page: Number(page),
      limit: Number(limit),
      total,
      knowledgeList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update knowledge by ID (Admin)
// @route PUT /knowledgebase/:id
// @access Private (admin)
export const updateKnowledge = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    const knowledge = await KnowledgeBase.findById(req.params.id);
    if (!knowledge) {
      return next(new ApiError(404, "Knowledge not found"));
    }

    if (title) knowledge.title = title;
    if (content) knowledge.content = content;
    if (tags) knowledge.tags = tags;

    await knowledge.save();
    res.status(200).json(knowledge);
  } catch (error) {
    next(error);
  }
};

// @desc Delete knowledge by ID (Admin)
// @route DELETE /knowledgebase/:id
// @access Private (admin)
export const deleteKnowledge = async (req, res, next) => {
  try {
    const knowledge = await KnowledgeBase.findById(req.params.id);
    if (!knowledge) {
      return next(new ApiError(404, "Knowledge not found"));
    }

    await knowledge.deleteOne();

    res.status(200).json({ message: "Knowledge deleted successfully" });
  } catch (error) {
    next(error);
  }
};
