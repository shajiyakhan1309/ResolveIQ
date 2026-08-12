import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

// =====================================================
// CREATE TICKET
// =====================================================

export const createTicket = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      priority,
    } = req.body;

    if (
      !title ||
      !category ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, category, and description are required.",
      });
    }

    const priorityMap = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    const normalizedPriority =
      priorityMap[
        String(
          priority || "Medium"
        ).toLowerCase()
      ];

    if (!normalizedPriority) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority. Allowed values are Low, Medium, and High.",
      });
    }

    const createdBy =
      req.user.id;

    const ticket = new Ticket({
      title: String(title).trim(),
      category,
      description:
        String(description).trim(),
      priority:
        normalizedPriority,
      createdBy,
    });

    await ticket.save();

    return res.status(201).json({
      success: true,
      message:
        "Ticket created successfully.",
      ticket,
    });
  } catch (error) {
    console.error(
      "Create Ticket Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating ticket.",
    });
  }
};

// =====================================================
// GET MY TICKETS
// =====================================================

export const getMyTickets = async (
  req,
  res
) => {
  try {
    const tickets =
      await Ticket.find({
        createdBy: req.user.id,
      })
        .populate(
          "createdBy",
          "fullName email employeeId department region role"
        )
        .populate(
          "assignedTo",
          "fullName email employeeId department region role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error(
      "Get My Tickets Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching tickets.",
    });
  }
};

// =====================================================
// GET ALL TICKETS
//
// ADMIN ONLY
//
// Admin can see every ticket in the system.
// =====================================================

export const getAllTickets = async (
  req,
  res
) => {
  try {
    const tickets =
      await Ticket.find({})
        .populate(
          "createdBy",
          "fullName email employeeId department region role"
        )
        .populate(
          "assignedTo",
          "fullName email employeeId department region role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error(
      "Get All Tickets Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching all tickets.",
    });
  }
};

// =====================================================
// GET TECHNICIANS
//
// ADMIN ONLY
//
// Used by Admin when assigning a ticket.
// =====================================================

export const getTechnicians =
  async (req, res) => {
    try {
      const technicians =
        await User.find({
          role: "Technician",
          isActive: true,
        }).select(
          "fullName email employeeId department region role"
        );

      return res.status(200).json({
        success: true,
        technicians,
      });
    } catch (error) {
      console.error(
        "Get Technicians Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching technicians.",
      });
    }
  };

// =====================================================
// GET ASSIGNED TICKETS
//
// TECHNICIAN ONLY
// =====================================================

export const getAssignedTickets =
  async (req, res) => {
    try {
      const tickets =
        await Ticket.find({
          assignedTo:
            req.user.id,
        })
          .populate(
            "createdBy",
            "fullName email employeeId department region role"
          )
          .populate(
            "assignedTo",
            "fullName email employeeId department region role"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        tickets,
      });
    } catch (error) {
      console.error(
        "Get Assigned Tickets Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching assigned tickets.",
      });
    }
  };

// =====================================================
// GET TICKET BY ID
// =====================================================

export const getTicketById =
  async (req, res) => {
    try {
      const ticket =
        await Ticket.findById(
          req.params.id
        )
          .populate(
            "createdBy",
            "fullName email employeeId department region role"
          )
          .populate(
            "assignedTo",
            "fullName email employeeId department region role"
          );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    } catch (error) {
      console.error(
        "Get Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching ticket.",
      });
    }
  };

// =====================================================
// UPDATE TICKET
// =====================================================

export const updateTicket =
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        priority,
        status,
      } = req.body;

      const updateData = {};

      if (title !== undefined) {
        updateData.title =
          String(title).trim();
      }

      if (
        category !== undefined
      ) {
        updateData.category =
          category;
      }

      if (
        description !==
        undefined
      ) {
        updateData.description =
          String(
            description
          ).trim();
      }

      if (
        priority !== undefined
      ) {
        const priorityMap = {
          low: "Low",
          medium: "Medium",
          high: "High",
        };

        const normalizedPriority =
          priorityMap[
            String(
              priority
            ).toLowerCase()
          ];

        if (
          !normalizedPriority
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid priority. Allowed values are Low, Medium, and High.",
          });
        }

        updateData.priority =
          normalizedPriority;
      }

      if (
        status !== undefined
      ) {
        const allowedStatuses = [
          "Open",
          "In Progress",
          "Resolved",
          "Closed",
        ];

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid ticket status.",
          });
        }

        updateData.status =
          status;
      }

      const ticket =
        await Ticket.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Ticket updated successfully.",
        ticket,
      });
    } catch (error) {
      console.error(
        "Update Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while updating ticket.",
      });
    }
  };

// =====================================================
// UPDATE TICKET STATUS
//
// TECHNICIAN ONLY
//
// Open
//   ↓
// In Progress
//   ↓
// Resolved
// =====================================================

export const updateTicketStatus =
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Status is required.",
        });
      }

      const allowedStatuses = [
        "Open",
        "In Progress",
        "Resolved",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Allowed values are Open, In Progress, and Resolved.",
        });
      }

      const ticket =
        await Ticket.findById(
          req.params.id
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      if (
        !ticket.assignedTo ||
        String(
          ticket.assignedTo
        ) !==
          String(
            req.user.id
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you.",
        });
      }

      if (
        ticket.status ===
        "Closed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Closed tickets cannot be updated.",
        });
      }

      if (
        ticket.status ===
          "Open" &&
        status ===
          "Resolved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A ticket must be moved to In Progress before it can be resolved.",
        });
      }

      if (
        ticket.status ===
          "Resolved" &&
        status ===
          "Open"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A resolved ticket cannot be moved back to Open.",
        });
      }

      ticket.status =
        status;

      await ticket.save();

      return res.status(200).json({
        success: true,
        message:
          "Ticket status updated successfully.",
        ticket,
      });
    } catch (error) {
      console.error(
        "Update Ticket Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while updating ticket status.",
      });
    }
  };

// =====================================================
// CLOSE TICKET
//
// Employee -> own ticket
// Admin    -> any ticket
// =====================================================

export const closeTicket =
  async (req, res) => {
    try {
      const ticket =
        await Ticket.findById(
          req.params.id
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      const isOwner =
        String(
          ticket.createdBy
        ) ===
        String(
          req.user.id
        );

      if (
        req.user.role !==
          "Admin" &&
        !isOwner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only close your own tickets.",
        });
      }

      if (
        ticket.status ===
        "Closed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This ticket is already closed.",
        });
      }

      ticket.status =
        "Closed";

      await ticket.save();

      return res.status(200).json({
        success: true,
        message:
          "Ticket closed successfully.",
        ticket,
      });
    } catch (error) {
      console.error(
        "Close Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while closing ticket.",
      });
    }
  };

// =====================================================
// ASSIGN TICKET
//
// ADMIN ONLY
// =====================================================

export const assignTicket =
  async (req, res) => {
    try {
      const {
        technicianId,
      } = req.body;

      if (!technicianId) {
        return res.status(400).json({
          success: false,
          message:
            "Technician ID is required.",
        });
      }

      // -----------------------------------------------
      // Verify selected user is actually a Technician
      // -----------------------------------------------

      const technician =
        await User.findOne({
          _id: technicianId,
          role: "Technician",
          isActive: true,
        });

      if (!technician) {
        return res.status(400).json({
          success: false,
          message:
            "Selected user is not an active technician.",
        });
      }

      // -----------------------------------------------
      // Assign ticket
      // -----------------------------------------------

      const ticket =
        await Ticket.findByIdAndUpdate(
          req.params.id,
          {
            assignedTo:
              technician._id,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "createdBy",
            "fullName email employeeId department region role"
          )
          .populate(
            "assignedTo",
            "fullName email employeeId department region role"
          );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Ticket assigned successfully.",
        ticket,
      });
    } catch (error) {
      console.error(
        "Assign Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while assigning ticket.",
      });
    }
  };

// =====================================================
// DELETE TICKET
// =====================================================

export const deleteTicket =
  async (req, res) => {
    try {
      const ticket =
        await Ticket.findByIdAndDelete(
          req.params.id
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Ticket deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Ticket Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while deleting ticket.",
      });
    }
  };