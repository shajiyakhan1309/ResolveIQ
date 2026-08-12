import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // =====================================================
    // TICKET
    //
    // The ticket this comment belongs to.
    // =====================================================

    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    // =====================================================
    // AUTHOR
    //
    // The user who wrote the comment.
    // =====================================================

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // COMMENT TEXT
    // =====================================================

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
//
// These make fetching comments for a ticket faster.
// =====================================================

commentSchema.index({
  ticket: 1,
  createdAt: 1,
});

const Comment = mongoose.model(
  "Comment",
  commentSchema
);

export default Comment;