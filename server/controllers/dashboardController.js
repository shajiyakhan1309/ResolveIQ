import Ticket from "../models/Ticket.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { id, role } = req.user;

    // EMPLOYEE DASHBOARD
    if (role === "Employee") {
      const totalTickets = await Ticket.countDocuments({
        createdBy: id,
      });

      const openTickets = await Ticket.countDocuments({
        createdBy: id,
        status: "Open",
      });

      const inProgressTickets = await Ticket.countDocuments({
        createdBy: id,
        status: "In Progress",
      });

      const resolvedTickets = await Ticket.countDocuments({
        createdBy: id,
        status: "Resolved",
      });

      const closedTickets = await Ticket.countDocuments({
        createdBy: id,
        status: "Closed",
      });

      return res.status(200).json({
        success: true,
        role: "Employee",
        stats: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
        },
      });
    }

    // TECHNICIAN DASHBOARD
    if (role === "Technician") {
      const totalAssigned = await Ticket.countDocuments({
        assignedTo: id,
      });

      const openTickets = await Ticket.countDocuments({
        assignedTo: id,
        status: "Open",
      });

      const inProgressTickets = await Ticket.countDocuments({
        assignedTo: id,
        status: "In Progress",
      });

      const resolvedTickets = await Ticket.countDocuments({
        assignedTo: id,
        status: "Resolved",
      });

      const closedTickets = await Ticket.countDocuments({
        assignedTo: id,
        status: "Closed",
      });

      return res.status(200).json({
        success: true,
        role: "Technician",
        stats: {
          totalAssigned,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
        },
      });
    }

    // ADMIN DASHBOARD
    if (role === "Admin") {
      const totalTickets = await Ticket.countDocuments();

      const openTickets = await Ticket.countDocuments({
        status: "Open",
      });

      const inProgressTickets = await Ticket.countDocuments({
        status: "In Progress",
      });

      const resolvedTickets = await Ticket.countDocuments({
        status: "Resolved",
      });

      const closedTickets = await Ticket.countDocuments({
        status: "Closed",
      });

      return res.status(200).json({
        success: true,
        role: "Admin",
        stats: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
        },
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid user role.",
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics.",
    });
  }
};