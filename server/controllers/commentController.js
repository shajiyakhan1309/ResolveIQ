import Comment from "../models/Comment.js";
import Ticket from "../models/Ticket.js";

// =====================================================
// GET COMMENTS FOR A TICKET
//
// GET /api/tickets/:ticketId/comments
//
// Access:
// - Employee: their own tickets
// - Technician: tickets assigned to them
// - Admin: any ticket
// =====================================================

export const getComments = async (
  req,
  res
) => {
  try {
    const { ticketId } =
      req.params;

    // =================================================
    // FIND TICKET
    // =================================================

    const ticket =
      await Ticket.findById(
        ticketId
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message:
          "Ticket not found.",
      });
    }

    // =================================================
    // USER INFORMATION
    // =================================================

    const userId =
      String(req.user.id);

    const userRole =
      req.user.role;

    // =================================================
    // CHECK ACCESS
    // =================================================

    const isAdmin =
      userRole === "Admin";

    const isEmployee =
      String(
        ticket.createdBy
      ) === userId;

    const isAssignedTechnician =
      ticket.assignedTo &&
      String(
        ticket.assignedTo
      ) === userId;

    // =================================================
    // DENY UNAUTHORIZED USERS
    // =================================================

    if (
      !isAdmin &&
      !isEmployee &&
      !isAssignedTechnician
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view comments for this ticket.",
      });
    }

    // =================================================
    // GET COMMENTS
    // =================================================

    const comments =
      await Comment.find({
        ticket: ticketId,
      })
        .populate(
          "author",
          "fullName email employeeId department region role"
        )
        .sort({
          createdAt: 1,
        });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      comments,
    });

  } catch (error) {
    console.error(
      "Get Comments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching comments.",
    });
  }
};

// =====================================================
// ADD COMMENT
//
// POST /api/tickets/:ticketId/comments
//
// Access:
// - Employee: their own tickets
// - Technician: tickets assigned to them
// - Admin: any ticket
// =====================================================

export const addComment = async (
  req,
  res
) => {
  try {
    const { ticketId } =
      req.params;

    const { message } =
      req.body;

    // =================================================
    // VALIDATE MESSAGE
    // =================================================

    if (
      !message ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Comment message is required.",
      });
    }

    // =================================================
    // CHECK MESSAGE LENGTH
    // =================================================

    if (
      message.trim().length >
      2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Comment cannot exceed 2000 characters.",
      });
    }

    // =================================================
    // FIND TICKET
    // =================================================

    const ticket =
      await Ticket.findById(
        ticketId
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message:
          "Ticket not found.",
      });
    }

    // =================================================
    // USER INFORMATION
    // =================================================

    const userId =
      String(req.user.id);

    const userRole =
      req.user.role;

    // =================================================
    // CHECK ACCESS
    // =================================================

    const isAdmin =
      userRole === "Admin";

    const isEmployee =
      String(
        ticket.createdBy
      ) === userId;

    const isAssignedTechnician =
      ticket.assignedTo &&
      String(
        ticket.assignedTo
      ) === userId;

    // =================================================
    // DENY UNAUTHORIZED USERS
    // =================================================

    if (
      !isAdmin &&
      !isEmployee &&
      !isAssignedTechnician
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to comment on this ticket.",
      });
    }

    // =================================================
    // CLOSED TICKET
    //
    // A closed ticket is completed.
    // No new comments can be added.
    // =================================================

    if (
      ticket.status ===
      "Closed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Comments cannot be added to a closed ticket.",
      });
    }

    // =================================================
    // CREATE COMMENT
    // =================================================

    const comment =
      await Comment.create({
        ticket:
          ticketId,

        author:
          req.user.id,

        message:
          message.trim(),
      });

    // =================================================
    // GET POPULATED COMMENT
    // =================================================

    const populatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "author",
        "fullName email employeeId department region role"
      );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message:
        "Comment added successfully.",
      comment:
        populatedComment,
    });

  } catch (error) {
    console.error(
      "Add Comment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding comment.",
    });
  }
};