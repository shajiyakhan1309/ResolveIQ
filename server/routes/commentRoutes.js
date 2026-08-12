import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getComments,
  addComment,
} from "../controllers/commentController.js";

const router = express.Router();

// =====================================================
// GET COMMENTS FOR A TICKET
// =====================================================

router.get(
  "/:ticketId/comments",
  authMiddleware,
  getComments
);

// =====================================================
// ADD COMMENT TO A TICKET
// =====================================================

router.post(
  "/:ticketId/comments",
  authMiddleware,
  addComment
);

// =====================================================
// EXPORT
// =====================================================

export default router;