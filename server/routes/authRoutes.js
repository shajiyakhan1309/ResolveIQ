import express from "express";

import {
  signup,
  login,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import authorizeRoles from "../middleware/roleMiddleware.js";

const router =
  express.Router();

// =====================================================
// PUBLIC SIGNUP
//
// Anyone can register.
// Backend ALWAYS creates Employee.
// =====================================================

router.post(
  "/signup",
  signup
);

// =====================================================
// PUBLIC LOGIN
// =====================================================

router.post(
  "/login",
  login
);

// =====================================================
// PROFILE
//
// Any logged-in user
// =====================================================

router.get(
  "/profile",
  authMiddleware,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Profile access granted.",
      user: req.user,
    });
  }
);

// =====================================================
// ADMIN TEST ROUTE
//
// Admin only
// =====================================================

router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("Admin"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Welcome Admin!",
    });
  }
);

// =====================================================
// EXPORT
// =====================================================

export default router;