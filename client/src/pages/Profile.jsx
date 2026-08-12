import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import API_BASE_URL from "../config/api";

// =====================================================
// STATUS COLORS
// =====================================================

const statusClasses = {
  Open:
    "bg-amber-100 text-amber-800",

  "In Progress":
    "bg-sky-100 text-sky-800",

  Resolved:
    "bg-emerald-100 text-emerald-800",

  Closed:
    "bg-slate-200 text-slate-800",
};

// =====================================================
// PRIORITY COLORS
// =====================================================

const priorityClasses = {
  High:
    "bg-rose-100 text-rose-800",

  Medium:
    "bg-amber-100 text-amber-800",

  Low:
    "bg-emerald-100 text-emerald-800",

  Critical:
    "bg-purple-100 text-purple-800",
};

// =====================================================
// INDIAN STATES + UNION TERRITORIES
// =====================================================

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",

  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// =====================================================
// DATE FORMATTER
// =====================================================

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// PROFILE
// =====================================================

const Profile = () => {
  const navigate = useNavigate();

  const getDashboardPath = () => {
  const loggedInUser = JSON.parse(
    localStorage.getItem(
      "resolveiq-logged-in-user"
    ) || "{}"
  );

  if (loggedInUser.role === "Admin") {
    return "/admin/dashboard";
  }

  if (loggedInUser.role === "Technician") {
    return "/technician/dashboard";
  }

  return "/dashboard";
};
  // ===================================================
  // USER DATA
  // ===================================================

  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "Employee",
    employeeId: "—",
    department: "—",
    state: "",
    isActive: true,
  });

  const [draftUser, setDraftUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "Employee",
    employeeId: "—",
    department: "—",
    state: "",
    isActive: true,
  });

  // ===================================================
  // EDIT STATE
  // ===================================================

  const [isEditing, setIsEditing] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  // ===================================================
  // PROFILE PHOTO
  // ===================================================

  const [photoUrl, setPhotoUrl] =
    useState(null);

  // ===================================================
  // TICKETS
  // ===================================================

  const [tickets, setTickets] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // ===================================================
  // DETERMINE ROLE
  // ===================================================

  const isAdmin =
    user.role === "Admin";

  // ===================================================
  // LOAD LOGGED-IN USER
  // ===================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        const loggedInUser =
          JSON.parse(
            localStorage.getItem(
              "resolveiq-logged-in-user"
            ) || "{}"
          );

        const token =
          localStorage.getItem(
            "resolveiq-token"
          );

        if (!token) {
          navigate("/login");
          return;
        }

        // =================================================
        // ADMIN
        //
        // Fetch fresh Admin profile from MongoDB.
        // =================================================

        if (
          loggedInUser.role === "Admin"
        ) {
          const response =
            await fetch(
              `${API_BASE_URL}/api/admin/profile`,
              {
                method: "GET",
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const contentType =
            response.headers.get(
              "content-type"
            ) || "";

          const text =
            await response.text();

          let result = {};

          if (
            contentType.includes(
              "application/json"
            )
          ) {
            result = text
              ? JSON.parse(text)
              : {};
          } else {
            throw new Error(
              "Server returned an unexpected response. Please make sure the backend is running."
            );
          }

          if (
            response.status === 401
          ) {
            localStorage.removeItem(
              "resolveiq-token"
            );

            localStorage.removeItem(
              "resolveiq-logged-in-user"
            );

            navigate("/login");
            return;
          }

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Unable to load Admin profile."
            );
          }

          const admin =
            result.user;

          const profileData = {
            id:
              admin._id ||
              admin.id ||
              "",

            name:
              admin.fullName ||
              "",

            email:
              admin.email ||
              "",

            role:
              admin.role ||
              "Admin",

            employeeId:
              admin.employeeId ||
              "—",

            department:
              admin.department ||
              "—",

            state:
              admin.region ||
              "",

            isActive:
              admin.isActive !== false,
          };

          setUser(profileData);
          setDraftUser(profileData);

          // Keep local storage synchronized
          const updatedLoggedInUser = {
            ...loggedInUser,

            id:
              admin._id ||
              admin.id,

            fullName:
              admin.fullName,

            name:
              admin.fullName,

            email:
              admin.email,

            role:
              admin.role,

            employeeId:
              admin.employeeId ||
              "",

            department:
              admin.department ||
              "",

            region:
              admin.region ||
              "",

            state:
              admin.region ||
              "",

            isActive:
              admin.isActive !== false,
          };

          localStorage.setItem(
            "resolveiq-logged-in-user",
            JSON.stringify(
              updatedLoggedInUser
            )
          );

          return;
        }

        // =================================================
        // EMPLOYEE / TECHNICIAN
        //
        // Keep the existing local-storage behavior.
        // =================================================

        const storedUsers =
          JSON.parse(
            localStorage.getItem(
              "resolveiq-users"
            ) || "[]"
          );

        const matchedUser =
          Array.isArray(storedUsers)
            ? storedUsers.find(
                (entry) =>
                  entry.email?.toLowerCase() ===
                  loggedInUser.email?.toLowerCase()
              )
            : null;

        const profileData = {
          id:
            matchedUser?._id ||
            matchedUser?.id ||
            loggedInUser.id ||
            "",

          name:
            matchedUser?.fullName ||
            `${matchedUser?.firstName || ""} ${
              matchedUser?.lastName || ""
            }`.trim() ||
            loggedInUser.fullName ||
            loggedInUser.name ||
            "User",

          email:
            matchedUser?.email ||
            loggedInUser.email ||
            "",

          role:
            matchedUser?.role ||
            loggedInUser.role ||
            "Employee",

          employeeId:
            matchedUser?.employeeId ||
            loggedInUser.employeeId ||
            "—",

          department:
            matchedUser?.department ||
            loggedInUser.department ||
            "—",

          state:
            matchedUser?.state ||
            matchedUser?.region ||
            loggedInUser.state ||
            loggedInUser.region ||
            "",

          isActive:
            matchedUser?.isActive !== false &&
            loggedInUser.isActive !== false,
        };

        setUser(profileData);
        setDraftUser(profileData);

      } catch (error) {
        console.error(
          "Failed to load profile data:",
          error
        );

        setSaveMessage(
          error.message ||
            "Unable to load profile."
        );
      }
    };

    loadUser();
  }, [navigate]);

  // ===================================================
  // FETCH MY TICKETS
  // ===================================================

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const token =
        localStorage.getItem(
          "resolveiq-token"
        );

      if (!token) {
        navigate("/login");
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/tickets`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const text =
        await response.text();

      let result = {};

      // =================================================
      // SAFELY PARSE JSON
      // =================================================

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result = text
          ? JSON.parse(text)
          : {};
      } else {
        throw new Error(
          "Server returned an unexpected response. Please make sure the backend is running."
        );
      }

      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "resolveiq-token"
        );

        localStorage.removeItem(
          "resolveiq-logged-in-user"
        );

        navigate("/login");

        return;
      }

      // =================================================
      // OTHER ERRORS
      // =================================================

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to fetch your tickets."
        );
      }

      // =================================================
      // STORE TICKETS
      // =================================================

      setTickets(
        Array.isArray(
          result.tickets
        )
          ? result.tickets
          : []
      );

    } catch (error) {
      console.error(
        "Failed to fetch tickets:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to connect to the server. Please make sure the backend is running."
      );

      setTickets([]);

    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // LOAD TICKETS
  // ===================================================

  useEffect(() => {
    fetchTickets();
  }, []);

  // ===================================================
  // EDIT PROFILE
  // ===================================================

  const handleEdit = () => {
    setDraftUser({
      ...user,
    });

    setIsEditing(true);
    setSaveMessage("");
  };

  // ===================================================
  // CANCEL EDIT
  // ===================================================

  const handleCancel = () => {
    setDraftUser({
      ...user,
    });

    setIsEditing(false);
    setSaveMessage("");
  };

  // ===================================================
  // HANDLE EDITABLE FIELD
  // ===================================================

  const handleInputChange = (
    field,
    value
  ) => {
    setDraftUser((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ===================================================
  // SAVE ADMIN PROFILE
  // ===================================================

  const saveAdminProfile = async () => {
    try {
      setIsSaving(true);
      setSaveMessage("");

      const token =
        localStorage.getItem(
          "resolveiq-token"
        );

      if (!token) {
        navigate("/login");
        return;
      }

      const name =
        draftUser.name.trim();

      const employeeId =
        draftUser.employeeId === "—"
          ? ""
          : draftUser.employeeId.trim();

      const department =
        draftUser.department === "—"
          ? ""
          : draftUser.department.trim();

      const region =
        draftUser.state.trim();

      // =================================================
      // VALIDATION
      // =================================================

      if (!name) {
        setSaveMessage(
          "Full name cannot be empty."
        );

        return;
      }

      if (!region) {
        setSaveMessage(
          "Please select your state / region."
        );

        return;
      }

      // =================================================
      // BACKEND REQUEST
      // =================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/profile`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              fullName: name,
              employeeId,
              department,
              region,
            }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const text =
        await response.text();

      let result = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        result = text
          ? JSON.parse(text)
          : {};
      } else {
        throw new Error(
          "Server returned an unexpected response."
        );
      }

      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "resolveiq-token"
        );

        localStorage.removeItem(
          "resolveiq-logged-in-user"
        );

        navigate("/login");

        return;
      }

      // =================================================
      // ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update Admin profile."
        );
      }

      // =================================================
      // UPDATED USER FROM DATABASE
      // =================================================

      const admin =
        result.user;

      const updatedUser = {
        id:
          admin._id ||
          admin.id ||
          user.id,

        name:
          admin.fullName ||
          name,

        email:
          admin.email ||
          user.email,

        role:
          admin.role ||
          "Admin",

        employeeId:
          admin.employeeId ||
          "—",

        department:
          admin.department ||
          "—",

        state:
          admin.region ||
          region,

        isActive:
          admin.isActive !== false,
      };

      setUser(updatedUser);
      setDraftUser(updatedUser);

      setIsEditing(false);

      setSaveMessage(
        "Admin profile updated successfully."
      );

      // =================================================
      // UPDATE LOGGED-IN USER STORAGE
      // =================================================

      const currentLoggedInUser =
        JSON.parse(
          localStorage.getItem(
            "resolveiq-logged-in-user"
          ) || "{}"
        );

      const updatedLoggedInUser = {
        ...currentLoggedInUser,

        id:
          admin._id ||
          admin.id ||
          currentLoggedInUser.id,

        fullName:
          updatedUser.name,

        name:
          updatedUser.name,

        email:
          updatedUser.email,

        role:
          "Admin",

        employeeId:
          updatedUser.employeeId === "—"
            ? ""
            : updatedUser.employeeId,

        department:
          updatedUser.department === "—"
            ? ""
            : updatedUser.department,

        region:
          updatedUser.state,

        state:
          updatedUser.state,

        isActive:
          updatedUser.isActive,
      };

      localStorage.setItem(
        "resolveiq-logged-in-user",
        JSON.stringify(
          updatedLoggedInUser
        )
      );

    } catch (error) {
      console.error(
        "Update Admin Profile Error:",
        error
      );

      setSaveMessage(
        error.message ||
          "Unable to update Admin profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ===================================================
  // SAVE EMPLOYEE / TECHNICIAN PROFILE
  // ===================================================

  const saveEmployeeProfile = () => {
    const name =
      draftUser.name.trim();

    const email =
      draftUser.email
        .trim()
        .toLowerCase();

    const state =
      draftUser.state.trim();

    // =================================================
    // VALIDATION
    // =================================================

    if (!name) {
      setSaveMessage(
        "Full name cannot be empty."
      );

      return;
    }

    if (!email) {
      setSaveMessage(
        "Email address cannot be empty."
      );

      return;
    }

    if (!state) {
      setSaveMessage(
        "Please select your state / region."
      );

      return;
    }

    // =================================================
    // EMPLOYEE / TECHNICIAN CAN CHANGE:
    //
    // - Name
    // - Email
    // - State / Region
    //
    // PROTECTED:
    //
    // - Employee ID
    // - Department
    // - Role
    // =================================================

    const updatedUser = {
      ...user,

      name,

      email,

      state,

      employeeId:
        user.employeeId,

      department:
        user.department,

      role:
        user.role,
    };

    // =================================================
    // UPDATE REACT STATE
    // =================================================

    setUser(updatedUser);

    setDraftUser(updatedUser);

    setIsEditing(false);

    setSaveMessage(
      "Profile updated successfully."
    );

    // =================================================
    // UPDATE LOCAL STORAGE
    // =================================================

    try {
      const storedUsers =
        JSON.parse(
          localStorage.getItem(
            "resolveiq-users"
          ) || "[]"
        );

      const previousEmail =
        user.email?.toLowerCase();

      const [
        firstName,
        ...lastNameParts
      ] =
        updatedUser.name.split(" ");

      const lastName =
        lastNameParts.join(" ");

      const nextUsers =
        Array.isArray(
          storedUsers
        )
          ? storedUsers.map(
              (entry) => {
                if (
                  entry.email?.toLowerCase() ===
                  previousEmail
                ) {
                  return {
                    ...entry,

                    firstName:
                      firstName ||
                      entry.firstName,

                    lastName:
                      lastName ||
                      entry.lastName,

                    fullName:
                      updatedUser.name,

                    email:
                      updatedUser.email,

                    state:
                      updatedUser.state,

                    region:
                      updatedUser.state,

                    // Protected fields
                    role:
                      entry.role,

                    employeeId:
                      entry.employeeId,

                    department:
                      entry.department,
                  };
                }

                return entry;
              }
            )
          : [];

      localStorage.setItem(
        "resolveiq-users",
        JSON.stringify(
          nextUsers
        )
      );

      // =================================================
      // UPDATE LOGGED-IN USER
      // =================================================

      const currentLoggedInUser =
        JSON.parse(
          localStorage.getItem(
            "resolveiq-logged-in-user"
          ) || "{}"
        );

      const updatedLoggedInUser = {
        ...currentLoggedInUser,

        fullName:
          updatedUser.name,

        name:
          updatedUser.name,

        email:
          updatedUser.email,

        state:
          updatedUser.state,

        region:
          updatedUser.state,

        // Protected fields
        role:
          currentLoggedInUser.role ||
          updatedUser.role,

        employeeId:
          currentLoggedInUser.employeeId ||
          updatedUser.employeeId,

        department:
          currentLoggedInUser.department ||
          updatedUser.department,
      };

      localStorage.setItem(
        "resolveiq-logged-in-user",
        JSON.stringify(
          updatedLoggedInUser
        )
      );

    } catch (error) {
      console.error(
        "Failed to save profile changes:",
        error
      );

      setSaveMessage(
        "Profile was updated, but there was a problem saving it locally."
      );
    }
  };

  // ===================================================
  // SAVE PROFILE
  // ===================================================

  const handleSave = async () => {
    if (isAdmin) {
      await saveAdminProfile();
    } else {
      saveEmployeeProfile();
    }
  };

  // ===================================================
  // PROFILE PHOTO
  // ===================================================

  const handleUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setSaveMessage(
        "Please select a valid image file."
      );

      return;
    }

    if (photoUrl) {
      URL.revokeObjectURL(
        photoUrl
      );
    }

    const newPhotoUrl =
      URL.createObjectURL(file);

    setPhotoUrl(
      newPhotoUrl
    );

    setSaveMessage(
      "Profile photo updated."
    );
  };

  // ===================================================
  // INITIALS
  // ===================================================

  const initials =
    useMemo(() => {
      const name =
        user.name?.trim();

      if (!name) {
        return "U";
      }

      return name
        .split(" ")
        .filter(Boolean)
        .map(
          (part) =>
            part.charAt(0)
        )
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }, [user.name]);

  // ===================================================
  // TICKET COUNTS
  // ===================================================

  const ticketCounts =
    useMemo(() => {
      return {
        total:
          tickets.length,

        open:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "Open"
          ).length,

        inProgress:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "In Progress"
          ).length,

        resolved:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "Resolved"
          ).length,

        closed:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "Closed"
          ).length,
      };
    }, [tickets]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            ResolveIQ
          </p>

          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Profile
          </h1>

        </div>

       <Link
  to={getDashboardPath()}
  className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-center text-sm font-semibold text-slate-100 transition hover:bg-slate-800 sm:w-auto"
>
  Back to dashboard
</Link>

      </nav>

      {/* =================================================
          PAGE CONTENT
      ================================================= */}

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.6)] sm:p-6">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

            {/* USER INFORMATION */}

            <div className="flex min-w-0 items-center gap-3 sm:gap-4">

              {/* PROFILE PHOTO */}

              <label
                htmlFor="photo-upload"
                className="group relative cursor-pointer"
              >

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-xl font-semibold text-cyan-300 sm:h-20 sm:w-20 sm:text-2xl">

                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}

                </div>

                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/70 opacity-0 transition-opacity group-hover:opacity-100">

                  <span className="text-xs font-medium text-white">
                    Upload
                  </span>

                </div>

              </label>

              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={
                  handleUpload
                }
              />

              {/* NAME */}

              <div>

                <p className="break-words text-xl font-semibold text-white sm:text-2xl">
                  {user.name ||
                    "User"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {user.role}
                  {" · "}
                  {user.employeeId}
                </p>

                <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">

                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  {user.isActive
                    ? "Active"
                    : "Inactive"}

                </span>

              </div>

            </div>

            {/* TICKET SUMMARY */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

              {/* TOTAL */}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">

                <p className="text-2xl font-semibold text-cyan-300">
                  {isLoading
                    ? "..."
                    : ticketCounts.total}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Total
                </p>

              </div>

              {/* OPEN */}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">

                <p className="text-2xl font-semibold text-amber-300">
                  {isLoading
                    ? "..."
                    : ticketCounts.open}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Open
                </p>

              </div>

              {/* IN PROGRESS */}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">

                <p className="text-2xl font-semibold text-sky-300">
                  {isLoading
                    ? "..."
                    : ticketCounts.inProgress}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  In Progress
                </p>

              </div>

              {/* RESOLVED */}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">

                <p className="text-2xl font-semibold text-emerald-300">
                  {isLoading
                    ? "..."
                    : ticketCounts.resolved}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Resolved
                </p>

              </div>

              {/* CLOSED */}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-center">

                <p className="text-2xl font-semibold text-slate-300">
                  {isLoading
                    ? "..."
                    : ticketCounts.closed}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Closed
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6">

          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Personal information
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Account details
              </h2>

            </div>

            {/* EDIT BUTTON */}

            {!isEditing && (
              <button
                type="button"
                onClick={
                  handleEdit
                }
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Edit profile
              </button>
            )}

          </div>

          {/* =================================================
              PROFILE FIELDS
          ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">

            {/* FULL NAME */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-400">
                Full name
              </label>

              <input
                type="text"
                value={
                  draftUser.name
                }
                readOnly={
                  !isEditing
                }
                onChange={(event) =>
                  handleInputChange(
                    "name",
                    event.target.value
                  )
                }
                className={`w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm outline-none ${
                  isEditing
                    ? "bg-slate-950 text-white focus:border-cyan-500"
                    : "cursor-default bg-slate-950/70 text-slate-200"
                }`}
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-400">
                Email address
              </label>

              <input
                type="email"
                value={
                  draftUser.email
                }
                readOnly={
                  isAdmin
                    ? true
                    : !isEditing
                }
                onChange={(event) =>
                  handleInputChange(
                    "email",
                    event.target.value
                  )
                }
                className={`w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm outline-none ${
                  isEditing &&
                  !isAdmin
                    ? "bg-slate-950 text-white focus:border-cyan-500"
                    : "cursor-not-allowed bg-slate-950/70 text-slate-400"
                }`}
              />

              {isAdmin && (
                <p className="mt-2 text-xs text-slate-600">
                  Admin email cannot be changed here.
                </p>
              )}

            </div>

            {/* EMPLOYEE ID */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">

                Employee ID

                {!isAdmin && (
                  <span className="text-xs">
                    🔒
                  </span>
                )}

              </label>

              <input
                type="text"
                value={
                  draftUser.employeeId ===
                  "—"
                    ? ""
                    : draftUser.employeeId
                }
                readOnly={
                  !isAdmin ||
                  !isEditing
                }
                onChange={(event) =>
                  handleInputChange(
                    "employeeId",
                    event.target.value
                  )
                }
                placeholder="Enter employee ID"
                className={`w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm outline-none ${
                  isAdmin &&
                  isEditing
                    ? "bg-slate-950 text-white focus:border-cyan-500"
                    : "cursor-not-allowed bg-slate-950/70 text-slate-400"
                }`}
              />

              <p className="mt-2 text-xs text-slate-600">
                {isAdmin
                  ? "You can update your own Employee ID."
                  : "Employee ID is managed by an administrator."}
              </p>

            </div>

            {/* DEPARTMENT */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">

                Department

                {!isAdmin && (
                  <span className="text-xs">
                    🔒
                  </span>
                )}

              </label>

              <input
                type="text"
                value={
                  draftUser.department ===
                  "—"
                    ? ""
                    : draftUser.department
                }
                readOnly={
                  !isAdmin ||
                  !isEditing
                }
                onChange={(event) =>
                  handleInputChange(
                    "department",
                    event.target.value
                  )
                }
                placeholder="Enter department"
                className={`w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm outline-none ${
                  isAdmin &&
                  isEditing
                    ? "bg-slate-950 text-white focus:border-cyan-500"
                    : "cursor-not-allowed bg-slate-950/70 text-slate-400"
                }`}
              />

              <p className="mt-2 text-xs text-slate-600">
                {isAdmin
                  ? "You can update your own department."
                  : "Department is managed by an administrator."}
              </p>

            </div>

            {/* ROLE */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">

                Role

                <span className="text-xs">
                  🔒
                </span>

              </label>

              <input
                type="text"
                value={
                  draftUser.role
                }
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400 outline-none"
              />

              <p className="mt-2 text-xs text-slate-600">
                Role is managed by the system administrator.
              </p>

            </div>

            {/* STATE / REGION */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-400">
                State / Region
              </label>

              <select
                value={
                  draftUser.state ||
                  ""
                }
                disabled={
                  !isEditing
                }
                onChange={(event) =>
                  handleInputChange(
                    "state",
                    event.target.value
                  )
                }
                className={`w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm outline-none ${
                  isEditing
                    ? "cursor-pointer bg-slate-950 text-white focus:border-cyan-500"
                    : "cursor-not-allowed bg-slate-950/70 text-slate-400"
                }`}
              >

                <option
                  value=""
                  disabled
                >
                  Select your state / region
                </option>

                {indianStates.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                      className="bg-slate-950 text-white"
                    >
                      {state}
                    </option>
                  )
                )}

              </select>

              <p className="mt-2 text-xs text-slate-600">
                {isEditing
                  ? "Select your Indian state or union territory."
                  : "Click Edit profile to change your state / region."}
              </p>

            </div>

          </div>

          {/* =================================================
              EDIT ACTIONS
          ================================================= */}

          {isEditing && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={isSaving}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  isSaving
                }
                className="w-full rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSaving
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>
          )}

          {/* =================================================
              SAVE MESSAGE
          ================================================= */}

          {saveMessage && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                saveMessage
                  .toLowerCase()
                  .includes(
                    "success"
                  )
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              {saveMessage}
            </div>
          )}

        </section>

        {/* =================================================
            MY TICKETS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">

          {/* HEADER */}

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                My tickets
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Tickets created by you
              </h2>

            </div>

            <Link
              to="/my-tickets"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-center text-sm font-medium text-cyan-300 transition hover:bg-slate-800 sm:w-auto"
            >
              View all tickets
            </Link>

          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* LOADING */}

          {isLoading ? (

            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50">

              <div className="text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                <p className="mt-3 text-sm text-slate-400">
                  Loading your tickets...
                </p>

              </div>

            </div>

          ) : tickets.length === 0 ? (

            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-xl">
                🎫
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                No tickets yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-400">
                You haven't created any support tickets yet.
              </p>

              <Link
                to="/raise-ticket"
                className="mt-5 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Raise a Ticket
              </Link>

            </div>

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-slate-800">

              <table className="w-full min-w-[720px] text-left">

                <thead className="bg-slate-950/80">

                  <tr>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Ticket
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Priority
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800">

                  {tickets.map(
                    (ticket) => {

                      const ticketId =
                        ticket._id ||
                        ticket.id;

                      return (
                        <tr
                          key={
                            ticketId
                          }
                          className="transition hover:bg-slate-950/60"
                        >

                          {/* TITLE */}

                          <td className="px-5 py-4">

                            <p className="max-w-[280px] truncate text-sm font-semibold text-white">
                              {ticket.title ||
                                "Untitled Ticket"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              #
                              {String(
                                ticketId
                              ).slice(-6)}
                            </p>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {ticket.category ||
                              "Other"}
                          </td>

                          {/* PRIORITY */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                priorityClasses[
                                  ticket.priority
                                ] ||
                                "bg-slate-800 text-slate-200"
                              }`}
                            >
                              {ticket.priority ||
                                "Medium"}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                statusClasses[
                                  ticket.status
                                ] ||
                                "bg-slate-800 text-slate-200"
                              }`}
                            >
                              {ticket.status ||
                                "Open"}
                            </span>

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(
                              ticket.createdAt
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <Link
                              to={`/tickets/${ticketId}`}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-slate-800"
                            >
                              View
                            </Link>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>
  );
};

export default Profile;