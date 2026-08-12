import User from "../models/User.js";

// =====================================================
// GET ALL USERS
//
// ADMIN ONLY
//
// Returns Employees and Technicians.
// Admin's own account is NOT included here.
//
// Password is NEVER returned.
// =====================================================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $in: ["Employee", "Technician"],
      },
    })
      .select("-password")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get All Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching users.",
    });
  }
};


// =====================================================
// GET LOGGED-IN ADMIN PROFILE
//
// ADMIN ONLY
//
// Returns the currently logged-in Admin.
// =====================================================

export const getAdminProfile = async (
  req,
  res
) => {
  try {
    const admin = await User.findById(
      req.user.id
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "Admin profile not found.",
      });
    }

    if (admin.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin accounts can access this profile.",
      });
    }

    return res.status(200).json({
      success: true,
      user: admin,
    });
  } catch (error) {
    console.error(
      "Get Admin Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching Admin profile.",
    });
  }
};


// =====================================================
// UPDATE LOGGED-IN ADMIN PROFILE
//
// ADMIN ONLY
//
// Admin can change:
//
// - Full Name
// - Employee ID
// - Department
// - Region
//
// Admin CANNOT change:
//
// - Email
// - Password
// - Role
// - Account status
//
// Role must permanently remain Admin.
// =====================================================

export const updateAdminProfile = async (
  req,
  res
) => {
  try {
    const {
      fullName,
      employeeId,
      department,
      region,
    } = req.body;

    const admin = await User.findById(
      req.user.id
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "Admin profile not found.",
      });
    }

    if (admin.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin accounts can update this profile.",
      });
    }

    // =================================================
    // UPDATE FULL NAME
    // =================================================

    if (
      fullName !== undefined
    ) {
      if (
        !String(fullName).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name cannot be empty.",
        });
      }

      admin.fullName =
        String(fullName).trim();
    }

    // =================================================
    // UPDATE EMPLOYEE ID
    // =================================================

    if (
      employeeId !== undefined
    ) {
      const cleanedEmployeeId =
        String(employeeId).trim();

      if (
        cleanedEmployeeId === ""
      ) {
        admin.employeeId =
          undefined;
      } else {
        // Check whether another user already
        // has this Employee ID.
        const existingUser =
          await User.findOne({
            employeeId:
              cleanedEmployeeId,
            _id: {
              $ne: admin._id,
            },
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "This Employee ID is already assigned to another user.",
          });
        }

        admin.employeeId =
          cleanedEmployeeId;
      }
    }

    // =================================================
    // UPDATE DEPARTMENT
    // =================================================

    if (
      department !== undefined
    ) {
      admin.department =
        String(department).trim();
    }

    // =================================================
    // UPDATE REGION
    // =================================================

    if (
      region !== undefined
    ) {
      admin.region =
        String(region).trim();
    }

    // =================================================
    // NEVER CHANGE THESE
    // =================================================

    admin.role = "Admin";

    // Email remains unchanged.
    // Password remains unchanged.
    // isActive remains unchanged.

    await admin.save();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Admin profile updated successfully.",

      user: {
        id:
          admin._id,

        fullName:
          admin.fullName,

        email:
          admin.email,

        employeeId:
          admin.employeeId || "",

        department:
          admin.department || "",

        region:
          admin.region || "",

        role:
          admin.role,

        isActive:
          admin.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Update Admin Profile Error:",
      error
    );

    // Duplicate employeeId protection
    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This Employee ID is already assigned to another user.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating Admin profile.",
    });
  }
};


// =====================================================
// CHANGE USER ROLE
//
// ADMIN ONLY
//
// Employee    -> Technician
// Technician  -> Employee
//
// Admin accounts cannot be changed here.
// =====================================================

export const updateUserRole = async (
  req,
  res
) => {
  try {
    const {
      role,
    } = req.body;

    const userId =
      req.params.id;

    // =================================================
    // VALIDATE ROLE
    // =================================================

    if (!role) {
      return res.status(400).json({
        success: false,
        message:
          "Role is required.",
      });
    }

    const allowedRoles = [
      "Employee",
      "Technician",
    ];

    if (
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Admin can only assign Employee or Technician.",
      });
    }

    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // PROTECT ADMIN
    // =================================================

    if (
      user.role === "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin accounts cannot be changed through user role management.",
      });
    }

    // =================================================
    // CHECK SAME ROLE
    // =================================================

    if (
      user.role === role
    ) {
      return res.status(400).json({
        success: false,
        message:
          `User is already a ${role}.`,
      });
    }

    // =================================================
    // UPDATE ROLE
    // =================================================

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        `User role changed to ${role} successfully.`,

      user: {
        id:
          user._id,

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
      "Update User Role Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating user role.",
    });
  }
};


// =====================================================
// UPDATE EMPLOYEE / TECHNICIAN INFORMATION
//
// ADMIN ONLY
//
// Admin can update:
//
// - Employee ID
// - Department
//
// Region remains controlled by the user/profile
// unless we decide otherwise later.
//
// Role is handled separately by updateUserRole().
//
// Name, email and password are NOT changed here.
// =====================================================

export const updateUserDetails = async (
  req,
  res
) => {
  try {
    const {
      employeeId,
      department,
    } = req.body;

    const userId =
      req.params.id;

    // =================================================
    // FIND USER
    // =================================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // PROTECT ADMIN
    // =================================================

    if (
      user.role === "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin details cannot be changed through employee management.",
      });
    }

    // =================================================
    // EMPLOYEE ID
    // =================================================

    if (
      employeeId !== undefined
    ) {
      const cleanedEmployeeId =
        String(employeeId).trim();

      if (
        cleanedEmployeeId === ""
      ) {
        user.employeeId =
          undefined;
      } else {
        const existingUser =
          await User.findOne({
            employeeId:
              cleanedEmployeeId,
            _id: {
              $ne: user._id,
            },
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "This Employee ID is already assigned to another user.",
          });
        }

        user.employeeId =
          cleanedEmployeeId;
      }
    }

    // =================================================
    // DEPARTMENT
    // =================================================

    if (
      department !== undefined
    ) {
      user.department =
        String(department).trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "User details updated successfully.",

      user: {
        id:
          user._id,

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
      "Update User Details Error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This Employee ID is already assigned to another user.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating user details.",
    });
  }
};


// =====================================================
// ACTIVATE / DEACTIVATE USER
//
// ADMIN ONLY
//
// Employees and Technicians can be activated/deactivated.
//
// Admin accounts are protected.
// =====================================================

export const toggleUserStatus = async (
  req,
  res
) => {
  try {
    const userId =
      req.params.id;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // PROTECT ADMIN
    // =================================================

    if (
      user.role === "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin accounts cannot be activated or deactivated through user management.",
      });
    }

    // =================================================
    // TOGGLE STATUS
    // =================================================

    user.isActive =
      !user.isActive;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        user.isActive
          ? "User activated successfully."
          : "User deactivated successfully.",

      user: {
        id:
          user._id,

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
      "Toggle User Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing user status.",
    });
  }
};