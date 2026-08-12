import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =====================================================
// SIGNUP
//
// PUBLIC SIGNUP
//
// IMPORTANT:
// Public signup can ONLY create Employees.
//
// role sent from frontend/Postman is ignored.
// =====================================================

export const signup = async (
  req,
  res
) => {
  const {
    fullName,
    email,
    password,
  } = req.body;

  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !fullName ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "fullName, email, and password are required.",
    });
  }

  try {
    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // =================================================
    // CHECK EXISTING USER
    // =================================================

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User already exists with this email.",
      });
    }

    // =================================================
    // HASH PASSWORD
    // =================================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // =================================================
    // PUBLIC SIGNUP = EMPLOYEE
    // =================================================

    const newUser =
      new User({
        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        password:
          hashedPassword,

        role: "Employee",

        isActive: true,
      });

    await newUser.save();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully.",

      user: {
        id: newUser._id,
        fullName:
          newUser.fullName,
        email:
          newUser.email,
        role:
          newUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Signup Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while registering user.",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (
  req,
  res
) => {
  const {
    email,
    password,
  } = req.body;

  // ===================================================
  // VALIDATION
  // ===================================================

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message:
        "Email and password are required.",
    });
  }

  try {
    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // CHECK ACCOUNT STATUS
    // =================================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // =================================================
    // COMPARE PASSWORD
    // =================================================

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid password.",
      });
    }

    // =================================================
    // CREATE JWT
    // =================================================

    const token =
      jwt.sign(
        {
          id: user._id.toString(),
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",

      token,

      user: {
        id: user._id,
        fullName:
          user.fullName,
        email:
          user.email,
        employeeId:
          user.employeeId || "",
        department:
          user.department || "",
        region:
          user.region || "",
        role:
          user.role,
        isActive:
          user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in.",
    });
  }
};