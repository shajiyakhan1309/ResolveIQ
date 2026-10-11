import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

// =====================================================
// STATUS COLORS
// =====================================================

const statusClasses = {
  Open: "bg-amber-100 text-amber-800",
  "In Progress": "bg-sky-100 text-sky-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-200 text-slate-800",
};

// =====================================================
// PRIORITY COLORS
// =====================================================

const priorityClasses = {
  High: "bg-rose-100 text-rose-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-emerald-100 text-emerald-800",
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

const AdminDashboard = () => {
  const navigate = useNavigate();

  // ===================================================
  // DATA
  // ===================================================

  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);

  // ===================================================
  // LOADING / ERROR
  // ===================================================

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ===================================================
  // ACTIVE SECTION
  // ===================================================

  const [activeSection, setActiveSection] = useState("tickets");

  // ===================================================
  // TICKET FILTERS
  // ===================================================

  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // ===================================================
  // USER SEARCH
  // ===================================================

  const [userSearch, setUserSearch] = useState("");

  // ===================================================
  // TICKET ASSIGNMENT
  // ===================================================

  const [selectedTechnician, setSelectedTechnician] = useState({});
  const [assigningTicketId, setAssigningTicketId] = useState(null);

  // ===================================================
  // TOKEN
  // ===================================================

  const getToken = () => {
    return localStorage.getItem("resolveiq-token");
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem("resolveiq-token");
    localStorage.removeItem("resolveiq-logged-in-user");
    navigate("/login");
  };

  // ===================================================
  // SAFE JSON RESPONSE
  // ===================================================

  const parseResponse = async (response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }
  };

  // ===================================================
  // FETCH ADMIN DATA
  //
  // Backend routes:
  //
  // GET /api/tickets/admin/all
  // GET /api/admin/users
  // ===================================================

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [ticketResponse, usersResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/tickets/admin/all`,
            {
              method: "GET",
              headers,
            }
          ),

          fetch(
            `${API_BASE_URL}/api/admin/users`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

      const ticketResult =
        await parseResponse(ticketResponse);

      const usersResult =
        await parseResponse(usersResponse);

      if (
        ticketResponse.status === 401 ||
        usersResponse.status === 401
      ) {
        localStorage.removeItem("resolveiq-token");
        localStorage.removeItem(
          "resolveiq-logged-in-user"
        );
        navigate("/login");
        return;
      }

      if (
        ticketResponse.status === 403 ||
        usersResponse.status === 403
      ) {
        throw new Error(
          "You do not have Admin access."
        );
      }

      if (!ticketResponse.ok) {
        throw new Error(
          ticketResult.message ||
            "Unable to load tickets."
        );
      }

      if (!usersResponse.ok) {
        throw new Error(
          usersResult.message ||
            "Unable to load employees."
        );
      }

      setTickets(
        Array.isArray(ticketResult.tickets)
          ? ticketResult.tickets
          : []
      );

      setUsers(
        Array.isArray(usersResult.users)
          ? usersResult.users
          : []
      );
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to load Admin dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchAdminData();
  }, []);

  // ===================================================
  // TICKET STATISTICS
  // ===================================================

  const ticketStatistics = useMemo(() => {
    return {
      total: tickets.length,

      open: tickets.filter(
        (ticket) =>
          ticket.status === "Open"
      ).length,

      inProgress: tickets.filter(
        (ticket) =>
          ticket.status === "In Progress"
      ).length,

      resolved: tickets.filter(
        (ticket) =>
          ticket.status === "Resolved"
      ).length,

      closed: tickets.filter(
        (ticket) =>
          ticket.status === "Closed"
      ).length,

      unassigned: tickets.filter(
        (ticket) =>
          !ticket.assignedTo
      ).length,
    };
  }, [tickets]);

  // ===================================================
  // USER STATISTICS
  // ===================================================

  const userStatistics = useMemo(() => {
    return {
      total: users.length,

      employees: users.filter(
        (user) =>
          user.role === "Employee"
      ).length,

      technicians: users.filter(
        (user) =>
          user.role === "Technician"
      ).length,

      active: users.filter(
        (user) =>
          user.isActive
      ).length,

      inactive: users.filter(
        (user) =>
          !user.isActive
      ).length,
    };
  }, [users]);

  // ===================================================
  // FILTERED TICKETS
  // ===================================================

  const filteredTickets = useMemo(() => {
  const search =
    ticketSearch
      .trim()
      .toLowerCase();

  // =================================================
  // REMOVE CLOSED TICKETS FIRST
  // =================================================

  const activeTickets =
    tickets.filter(
      (ticket) =>
        ticket.status !== "Closed"
    );

  // =================================================
  // APPLY SEARCH + FILTERS
  // =================================================

  return activeTickets.filter(
    (ticket) => {
      const ticketId =
        String(
          ticket._id || ""
        ).toLowerCase();

      const title =
        String(
          ticket.title || ""
        ).toLowerCase();

      const employee =
        String(
          ticket.createdBy?.fullName ||
            ""
        ).toLowerCase();

      const employeeId =
        String(
          ticket.createdBy?.employeeId ||
            ""
        ).toLowerCase();

      const department =
        String(
          ticket.createdBy?.department ||
            ""
        ).toLowerCase();

      const technician =
        String(
          ticket.assignedTo?.fullName ||
            ""
        ).toLowerCase();

      const matchesSearch =
        !search ||
        ticketId.includes(search) ||
        title.includes(search) ||
        employee.includes(search) ||
        employeeId.includes(search) ||
        department.includes(search) ||
        technician.includes(search);

      // =================================================
      // STATUS FILTER
      //
      // Closed is already removed above.
      // =================================================

      const matchesStatus =
        statusFilter === "All" ||
        ticket.status ===
          statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        ticket.priority ===
          priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    }
  );
}, [
  tickets,
  ticketSearch,
  statusFilter,
  priorityFilter,
]);

  // ===================================================
  // FILTERED USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    const search =
      userSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter(
      (user) => {
        return (
          String(
            user.fullName || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            user.email || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            user.employeeId || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            user.department || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            user.region || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            user.role || ""
          )
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [users, userSearch]);

  // ===================================================
  // CHANGE USER ROLE
  //
  // Employee -> Technician
  // Technician -> Employee
  //
  // Admin accounts cannot be changed because the
  // backend protects Admin users.
  // ===================================================

  const handleChangeUserRole = async (
    user
  ) => {
    if (user.role === "Admin") {
      setErrorMessage(
        "Admin accounts cannot be changed from this screen."
      );
      return;
    }

    const nextRole =
      user.role === "Technician"
        ? "Employee"
        : "Technician";

    const confirmed =
      window.confirm(
        `${user.fullName} will be changed from ${user.role} to ${nextRole}. Continue?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const token =
        getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/users/${user._id}/role`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              role: nextRole,
            }),
          }
        );

      const result =
        await parseResponse(
          response
        );

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "resolveiq-token"
        );

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to change user role."
        );
      }

      setUsers(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              user._id
                ? {
                    ...item,
                    ...result.user,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Change user role error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to change user role."
      );
    }
  };

  // ===================================================
  // ACTIVATE / DEACTIVATE USER
  // ===================================================

  const handleToggleUserStatus =
    async (user) => {
      if (user.role === "Admin") {
        setErrorMessage(
          "Admin accounts cannot be deactivated from this screen."
        );
        return;
      }

      const action =
        user.isActive
          ? "deactivate"
          : "activate";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${user.fullName}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setErrorMessage("");

        const token =
          getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
           `${API_BASE_URL}/api/admin/users/${user._id}/status`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "resolveiq-token"
          );

          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to change user status."
          );
        }

        setUsers(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                user._id
                  ? {
                      ...item,
                      ...result.user,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          "Toggle user status error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to change user status."
        );
      }
    };

  // ===================================================
  // ASSIGN TECHNICIAN TO TICKET
  // ===================================================

  const handleAssignTechnician =
    async (ticketId) => {
      const technicianId =
        selectedTechnician[
          ticketId
        ];

      if (!technicianId) {
        setErrorMessage(
          "Please select a technician first."
        );

        return;
      }

      try {
        setAssigningTicketId(
          ticketId
        );

        setErrorMessage("");

        const token =
          getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/tickets/${ticketId}/assign`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                technicianId,
              }),
            }
          );

        const result =
          await parseResponse(
            response
          );

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "resolveiq-token"
          );

          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to assign technician."
          );
        }

        setTickets(
          (previous) =>
            previous.map(
              (ticket) =>
                ticket._id ===
                ticketId
                  ? result.ticket
                  : ticket
            )
        );

        setSelectedTechnician(
          (previous) => {
            const updated = {
              ...previous,
            };

            delete updated[
              ticketId
            ];

            return updated;
          }
        );
      } catch (error) {
        console.error(
          "Assign technician error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to assign technician."
        );
      } finally {
        setAssigningTicketId(
          null
        );
      }
    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="mx-auto flex min-h-[96px] w-full max-w-[1500px] items-center justify-between border-b border-slate-800 px-8">

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            ResolveIQ
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">

          <Link
            to="/profile"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
          >
            Profile
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            Logout
          </button>

        </div>
      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto w-full max-w-[1500px] px-8 py-10">

        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            System Management
          </h2>

          <p className="mt-2 text-base text-slate-400">
            Manage tickets and user roles across ResolveIQ.
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            SECTION NAVIGATION
        ================================================= */}

        <div className="mb-8 flex min-h-[64px] flex-wrap items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-2">

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                "tickets"
              )
            }
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeSection ===
              "tickets"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Ticket Management
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSection(
                "users"
              )
            }
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeSection ===
              "users"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Employee & Technician Management
          </button>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {isLoading ? (
          <section className="flex min-h-[650px] w-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90">

            <div className="text-center">

              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="mt-4 text-sm text-slate-400">
                Loading Admin dashboard...
              </p>

            </div>

          </section>
        ) : (
          <>

            {/* =================================================
                TICKET MANAGEMENT
            ================================================= */}

            {activeSection ===
              "tickets" && (
              <section>

                {/* STATISTICS */}

                <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Total Tickets
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {ticketStatistics.total}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Open
                    </p>

                    <p className="mt-3 text-3xl font-bold text-amber-300">
                      {ticketStatistics.open}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      In Progress
                    </p>

                    <p className="mt-3 text-3xl font-bold text-sky-300">
                      {ticketStatistics.inProgress}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Resolved
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                      {ticketStatistics.resolved}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Closed
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-300">
                      {ticketStatistics.closed}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Unassigned
                    </p>

                    <p className="mt-3 text-3xl font-bold text-rose-300">
                      {ticketStatistics.unassigned}
                    </p>
                  </div>

                </div>

                {/* FILTERS */}

                <div className="mb-6 flex min-h-[80px] w-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 lg:flex-row lg:items-center">

                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(event) =>
                      setTicketSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search tickets, employees, technicians..."
                    className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />

                  <select
  value={statusFilter}
  onChange={(event) =>
    setStatusFilter(
      event.target.value
    )
  }
  className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400"
>
  <option value="All">
    All Active Statuses
  </option>

  <option value="Open">
    Open
  </option>

  <option value="In Progress">
    In Progress
  </option>

  <option value="Resolved">
    Resolved
  </option>
</select>

                  <select
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target.value
                      )
                    }
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400"
                  >
                    <option value="All">
                      All Priorities
                    </option>
                    <option value="High">
                      High
                    </option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="Low">
                      Low
                    </option>
                  </select>

                </div>

                {/* TICKET TABLE */}

                <div className="min-h-[620px] w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-6">

                  {filteredTickets.length ===
                  0 ? (
                    <div className="flex min-h-[560px] items-center justify-center text-center">

                      <div>

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                          🎫
                        </div>

                        <h3 className="mt-5 text-xl font-semibold">
                          No tickets found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          No tickets match the selected filters.
                        </p>

                      </div>

                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-slate-800">

                      <table className="min-w-[1500px] w-full text-left">

                        <thead className="bg-slate-950">
                          <tr>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Ticket
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Employee
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Department
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Priority
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Status
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Technician
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Assign
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Action
                            </th>

                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800">

                          {filteredTickets.map(
                            (ticket) => {

                              const ticketId =
                                ticket._id;

                              const activeTechnicians =
                                users.filter(
                                  (user) =>
                                    user.role ===
                                      "Technician" &&
                                    user.isActive
                                );

                              return (
                                <tr
                                  key={ticketId}
                                  className="transition hover:bg-slate-800/50"
                                >

                                  <td className="px-6 py-5">

                                    <p className="font-semibold text-cyan-300">
                                      #
                                      {String(
                                        ticketId
                                      ).slice(-6)}
                                    </p>

                                    <p className="mt-1 max-w-[220px] truncate text-sm text-slate-400">
                                      {ticket.title}
                                    </p>

                                  </td>

                                  <td className="px-6 py-5">

                                    <p className="text-sm font-semibold">
                                      {ticket.createdBy
                                        ?.fullName ||
                                        "Unknown"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {ticket.createdBy
                                        ?.employeeId ||
                                        "No ID"}
                                    </p>

                                  </td>

                                  <td className="px-6 py-5 text-sm text-slate-300">
                                    {ticket.createdBy
                                      ?.department ||
                                      "—"}
                                  </td>

                                  <td className="px-6 py-5">

                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                        priorityClasses[
                                          ticket.priority
                                        ] ||
                                        "bg-slate-200 text-slate-800"
                                      }`}
                                    >
                                      {ticket.priority}
                                    </span>

                                  </td>

                                  <td className="px-6 py-5">

                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                        statusClasses[
                                          ticket.status
                                        ] ||
                                        "bg-slate-200 text-slate-800"
                                      }`}
                                    >
                                      {ticket.status}
                                    </span>

                                  </td>

                                  <td className="px-6 py-5">

                                    {ticket.assignedTo ? (
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {
                                            ticket
                                              .assignedTo
                                              .fullName
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                          {ticket
                                            .assignedTo
                                            .employeeId ||
                                            "No ID"}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-rose-300">
                                        Unassigned
                                      </span>
                                    )}

                                  </td>

                                  <td className="px-6 py-5">

                                    <div className="flex min-w-[270px] gap-2">

                                      <select
                                        value={
                                          selectedTechnician[
                                            ticketId
                                          ] ||
                                          ticket
                                            .assignedTo
                                            ?._id ||
                                          ""
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setSelectedTechnician(
                                            (
                                              previous
                                            ) => ({
                                              ...previous,
                                              [ticketId]:
                                                event
                                                  .target
                                                  .value,
                                            })
                                          )
                                        }
                                        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none"
                                      >

                                        <option value="">
                                          Select technician
                                        </option>

                                        {activeTechnicians.map(
                                          (
                                            technician
                                          ) => (
                                            <option
                                              key={
                                                technician._id
                                              }
                                              value={
                                                technician._id
                                              }
                                            >
                                              {
                                                technician.fullName
                                              }
                                            </option>
                                          )
                                        )}

                                      </select>

                                      <button
                                        type="button"
                                        disabled={
                                          assigningTicketId ===
                                          ticketId
                                        }
                                        onClick={() =>
                                          handleAssignTechnician(
                                            ticketId
                                          )
                                        }
                                        className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {assigningTicketId ===
                                        ticketId
                                          ? "..."
                                          : "Assign"}
                                      </button>

                                    </div>

                                  </td>

                                  <td className="px-6 py-5">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(
                                          `/tickets/${ticketId}`
                                        )
                                      }
                                      className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold transition hover:bg-slate-800"
                                    >
                                      View
                                    </button>

                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>
                      </table>

                    </div>
                  )}

                </div>

              </section>
            )}

            {/* =================================================
                EMPLOYEE / TECHNICIAN MANAGEMENT
            ================================================= */}

            {activeSection ===
              "users" && (
              <section>

                {/* USER STATISTICS */}

                <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Total Users
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      {userStatistics.total}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Employees
                    </p>

                    <p className="mt-3 text-3xl font-bold text-cyan-300">
                      {userStatistics.employees}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Technicians
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                      {userStatistics.technicians}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Active
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                      {userStatistics.active}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                    <p className="text-sm text-slate-400">
                      Inactive
                    </p>

                    <p className="mt-3 text-3xl font-bold text-rose-300">
                      {userStatistics.inactive}
                    </p>
                  </div>

                </div>

                {/* USER SEARCH */}

                <div className="mb-6 flex min-h-[80px] w-full items-center rounded-3xl border border-slate-800 bg-slate-900/80 p-5">

                  <input
                    type="text"
                    value={userSearch}
                    onChange={(event) =>
                      setUserSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search employee, ID, department, region, role..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />

                </div>

                {/* USER TABLE */}

                <div className="min-h-[620px] w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-6">

                  {filteredUsers.length ===
                  0 ? (
                    <div className="flex min-h-[560px] items-center justify-center text-center">

                      <div>

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                          👥
                        </div>

                        <h3 className="mt-5 text-xl font-semibold">
                          No users found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          No employees or technicians match your search.
                        </p>

                      </div>

                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-slate-800">

                      <table className="min-w-[1450px] w-full text-left">

                        <thead className="bg-slate-950">

                          <tr>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Employee
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Employee ID
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Department
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              State / Region
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Role
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Status
                            </th>

                            <th className="px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Actions
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-800">

                          {filteredUsers.map(
                            (user) => (
                              <tr
                                key={
                                  user._id
                                }
                                className="transition hover:bg-slate-800/50"
                              >

                                <td className="px-6 py-5">

                                  <p className="font-semibold text-slate-200">
                                    {user.fullName ||
                                      "Unknown"}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {user.email ||
                                      "—"}
                                  </p>

                                </td>

                                <td className="px-6 py-5 text-sm text-slate-300">
                                  {user.employeeId ||
                                    "—"}
                                </td>

                                <td className="px-6 py-5 text-sm text-slate-300">
                                  {user.department ||
                                    "—"}
                                </td>

                                <td className="px-6 py-5 text-sm text-slate-300">
                                  {user.region ||
                                    "—"}
                                </td>

                                <td className="px-6 py-5">

                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      user.role ===
                                      "Technician"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-sky-100 text-sky-800"
                                    }`}
                                  >
                                    {user.role}
                                  </span>

                                </td>

                                <td className="px-6 py-5">

                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      user.isActive
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {user.isActive
                                      ? "Active"
                                      : "Inactive"}
                                  </span>

                                </td>

                                <td className="px-6 py-5">

                                  {user.role ===
                                  "Admin" ? (
                                    <span className="text-xs text-slate-500">
                                      Admin account protected
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleChangeUserRole(
                                            user
                                          )
                                        }
                                        className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                          user.role ===
                                          "Technician"
                                            ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                                        }`}
                                      >
                                        {user.role ===
                                        "Technician"
                                          ? "Remove Technician"
                                          : "Make Technician"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleUserStatus(
                                            user
                                          )
                                        }
                                        className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                                          user.isActive
                                            ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                        }`}
                                      >
                                        {user.isActive
                                          ? "Deactivate"
                                          : "Activate"}
                                      </button>

                                    </div>
                                  )}

                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

              </section>
            )}

          </>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;