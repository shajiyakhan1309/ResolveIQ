import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  let isConnected = false;

  try {
    // =====================================================
    // VALIDATE ENVIRONMENT VARIABLES
    // =====================================================

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured in the .env file."
      );
    }

    if (!process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_PASSWORD is not configured in the .env file."
      );
    }

    // =====================================================
    // ADMIN DETAILS
    // =====================================================

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      "admin@resolveiq.com";

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    // =====================================================
    // CONNECT TO DATABASE
    // =====================================================

    await mongoose.connect(
      process.env.MONGO_URI
    );

    isConnected = true;

    console.log(
      "MongoDB connected successfully."
    );

    // =====================================================
    // CHECK IF ADMIN ALREADY EXISTS
    // =====================================================

    const existingAdmin =
      await User.findOne({
        email: adminEmail,
      });

    if (existingAdmin) {
      console.log(
        "An account with this email already exists."
      );

      return;
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword =
      await bcrypt.hash(
        adminPassword,
        12
      );

    // =====================================================
    // CREATE ADMIN
    // =====================================================

    const admin =
      new User({
        fullName:
          "ResolveIQ Admin",

        email:
          adminEmail,

        password:
          hashedPassword,

        employeeId:
          "ADMIN001",

        department:
          "IT Administration",

        region:
          "Maharashtra",

        role:
          "Admin",

        isActive:
          true,
      });

    await admin.save();

    // =====================================================
    // SUCCESS
    //
    // IMPORTANT:
    // NEVER print the password to the terminal.
    // =====================================================

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "Admin account created successfully!"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "Email:",
      admin.email
    );

    console.log(
      "Employee ID:",
      admin.employeeId
    );

    console.log(
      "Department:",
      admin.department
    );

    console.log(
      "Region:",
      admin.region
    );

    console.log(
      "Role:",
      admin.role
    );

    console.log(
      "Password: Stored securely as a hashed value."
    );

    console.log(
      "=========================================="
    );

    console.log("");
  } catch (error) {
    console.error(
      "Error creating Admin:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    // =====================================================
    // CLOSE DATABASE CONNECTION
    // =====================================================

    if (isConnected) {
      await mongoose.disconnect();

      console.log(
        "MongoDB connection closed."
      );
    }
  }
};

createAdmin();