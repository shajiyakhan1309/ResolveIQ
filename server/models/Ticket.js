import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // =====================================================
    // TICKET INFORMATION
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // CATEGORY
    // =====================================================

    category: {
      type: String,
      enum: [
        "Hardware",
        "Software",
        "Network",
        "Account",
        "Other",
      ],
      default: "Other",
    },

    // =====================================================
    // PRIORITY
    // =====================================================

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
      ],
      default: "Medium",
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Open",
    },

    // =====================================================
    // CREATED BY
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // ASSIGNED TECHNICIAN
    // =====================================================

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Ticket =
  mongoose.model(
    "Ticket",
    ticketSchema
  );

export default Ticket;