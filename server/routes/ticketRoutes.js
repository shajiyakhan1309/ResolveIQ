import express from "express";

import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTechnicians,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  getAssignedTickets,
  updateTicketStatus,
  closeTicket,
} from "../controllers/ticketController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import authorizeRoles from "../middleware/roleMiddleware.js";

const router =
  express.Router();

// =====================================================
// CREATE TICKET
// Employee
// =====================================================

router.post(
  "/",
  authMiddleware,
  createTicket
);

// =====================================================
// GET MY TICKETS
// Employee
// =====================================================

router.get(
  "/",
  authMiddleware,
  getMyTickets
);

// =====================================================
// GET ALL TICKETS
// Admin ONLY
//
// IMPORTANT:
// This must come before "/:id"
// =====================================================

router.get(
  "/admin/all",
  authMiddleware,
  authorizeRoles("Admin"),
  getAllTickets
);

// =====================================================
// GET TECHNICIANS
// Admin ONLY
// =====================================================

router.get(
  "/admin/technicians",
  authMiddleware,
  authorizeRoles("Admin"),
  getTechnicians
);

// =====================================================
// GET ASSIGNED TICKETS
// Technician ONLY
// =====================================================

router.get(
  "/assigned",
  authMiddleware,
  authorizeRoles("Technician"),
  getAssignedTickets
);

// =====================================================
// UPDATE TICKET STATUS
// Technician ONLY
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  authorizeRoles("Technician"),
  updateTicketStatus
);

// =====================================================
// CLOSE TICKET
//
// Employee -> own ticket
// Admin    -> any ticket
// =====================================================

router.put(
  "/:id/close",
  authMiddleware,
  closeTicket
);

// =====================================================
// ASSIGN TICKET
// Admin ONLY
// =====================================================

router.put(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("Admin"),
  assignTicket
);

// =====================================================
// GET TICKET BY ID
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  getTicketById
);

// =====================================================
// UPDATE TICKET
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  updateTicket
);

// =====================================================
// DELETE TICKET
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  deleteTicket
);

export default router;