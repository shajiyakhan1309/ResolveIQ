import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  getAllUsers,
  getAdminProfile,
  updateAdminProfile,
  updateUserRole,
  updateUserDetails,
  toggleUserStatus,
} from "../controllers/adminController.js";

const router = express.Router();

// =====================================================
// ALL ADMIN ROUTES
//
// Every route requires:
// 1. Authentication
// 2. Admin role
// =====================================================


// =====================================================
// GET ALL EMPLOYEES AND TECHNICIANS
// =====================================================

router.get(
  "/users",
  authMiddleware,
  authorizeRoles("Admin"),
  getAllUsers
);


// =====================================================
// GET LOGGED-IN ADMIN PROFILE
// =====================================================

router.get(
  "/profile",
  authMiddleware,
  authorizeRoles("Admin"),
  getAdminProfile
);


// =====================================================
// UPDATE LOGGED-IN ADMIN PROFILE
//
// Admin can update:
// - Name
// - Employee ID
// - Department
// - Region
//
// Role stays Admin.
// =====================================================

router.put(
  "/profile",
  authMiddleware,
  authorizeRoles("Admin"),
  updateAdminProfile
);


// =====================================================
// CHANGE EMPLOYEE / TECHNICIAN ROLE
//
// Employee -> Technician
// Technician -> Employee
// =====================================================

router.put(
  "/users/:id/role",
  authMiddleware,
  authorizeRoles("Admin"),
  updateUserRole
);


// =====================================================
// UPDATE EMPLOYEE / TECHNICIAN DETAILS
//
// Admin can update:
// - Employee ID
// - Department
// =====================================================

router.put(
  "/users/:id/details",
  authMiddleware,
  authorizeRoles("Admin"),
  updateUserDetails
);


// =====================================================
// ACTIVATE / DEACTIVATE USER
// =====================================================

router.put(
  "/users/:id/status",
  authMiddleware,
  authorizeRoles("Admin"),
  toggleUserStatus
);


// =====================================================
// EXPORT
// =====================================================

export default router;