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
};

// =====================================================
// TECHNICIAN DASHBOARD
// =====================================================

const TechnicianDashboard = () => {
  const navigate = useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [tickets, setTickets] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  // ===================================================
  // GET TOKEN
  // ===================================================

  const getToken = () => {
    return localStorage.getItem(
      "resolveiq-token"
    );
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "resolveiq-token"
    );

    localStorage.removeItem(
      "resolveiq-logged-in-user"
    );

    navigate("/login");
  };

  // ===================================================
  // FETCH ASSIGNED TICKETS
  // ===================================================

  const fetchAssignedTickets =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const token = getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/tickets/assigned`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
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
          try {
            result = text
              ? JSON.parse(text)
              : {};
          } catch {
            throw new Error(
              "Invalid JSON response from server."
            );
          }
        } else {
          throw new Error(
            "Server returned an unexpected response. Make sure the backend is running."
          );
        }

        // ---------------------------------------------
        // Unauthorized
        // ---------------------------------------------

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

        // ---------------------------------------------
        // Forbidden
        // ---------------------------------------------

        if (
          response.status === 403
        ) {
          throw new Error(
            result.message ||
              "You do not have Technician access."
          );
        }

        // ---------------------------------------------
        // Other errors
        // ---------------------------------------------

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load assigned tickets."
          );
        }

        // ---------------------------------------------
        // Set tickets
        // ---------------------------------------------

        setTickets(
          Array.isArray(
            result.tickets
          )
            ? result.tickets
            : []
        );

      } catch (error) {
        console.error(
          "Technician tickets error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load assigned tickets."
        );

      } finally {
        setIsLoading(false);
      }
    };

  // ===================================================
  // LOAD DATA
  // ===================================================

  useEffect(() => {
    fetchAssignedTickets();
  }, []);

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics =
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

        highPriority:
          tickets.filter(
            (ticket) =>
              ticket.priority ===
              "High"
          ).length,
      };
    }, [tickets]);

  // ===================================================
  // FILTER TICKETS
  //
  // CLOSED TICKETS ARE NOT PART OF THE ACTIVE
  // TECHNICIAN WORKFLOW.
  // ===================================================

  const filteredTickets =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return tickets.filter(
        (ticket) => {

          // -------------------------------------------
          // Never show Closed tickets
          // -------------------------------------------

          if (
            ticket.status ===
            "Closed"
          ) {
            return false;
          }

          const ticketId =
            String(
              ticket._id || ""
            ).toLowerCase();

          const title =
            String(
              ticket.title || ""
            ).toLowerCase();

          const employeeName =
            String(
              ticket.createdBy
                ?.fullName || ""
            ).toLowerCase();

          const employeeId =
            String(
              ticket.createdBy
                ?.employeeId || ""
            ).toLowerCase();

          const department =
            String(
              ticket.createdBy
                ?.department || ""
            ).toLowerCase();

          const category =
            String(
              ticket.category || ""
            ).toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            ticketId.includes(
              normalizedSearch
            ) ||
            title.includes(
              normalizedSearch
            ) ||
            employeeName.includes(
              normalizedSearch
            ) ||
            employeeId.includes(
              normalizedSearch
            ) ||
            department.includes(
              normalizedSearch
            ) ||
            category.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            ticket.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      tickets,
      search,
      statusFilter,
    ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-slate-800">

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">

          {/* BRAND */}

          <div className="min-w-0">

            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">
              ResolveIQ
            </p>

            <h1 className="mt-1 truncate text-2xl font-semibold sm:mt-2 sm:text-3xl">
              Technician Dashboard
            </h1>

          </div>

          {/* ACTIONS */}

          <div className="flex w-full gap-2 sm:w-auto sm:gap-3">

            <Link
              to="/profile"
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-800 sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex flex-1 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 sm:mb-8">

          <h2 className="text-2xl font-bold sm:text-3xl">
            My Assigned Tickets
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-3 sm:text-base">
            Manage and resolve tickets assigned to you.
          </p>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-300 sm:px-5">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6">

            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              Total Assigned
            </p>

            <p className="mt-2 text-2xl font-bold sm:mt-3 sm:text-3xl">
              {statistics.total}
            </p>

          </div>

          {/* OPEN */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6">

            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              Open
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-300 sm:mt-3 sm:text-3xl">
              {statistics.open}
            </p>

          </div>

          {/* IN PROGRESS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6">

            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              In Progress
            </p>

            <p className="mt-2 text-2xl font-bold text-sky-300 sm:mt-3 sm:text-3xl">
              {statistics.inProgress}
            </p>

          </div>

          {/* RESOLVED */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6">

            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              Resolved
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-300 sm:mt-3 sm:text-3xl">
              {statistics.resolved}
            </p>

          </div>

          {/* HIGH PRIORITY */}

          <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:col-span-2 sm:rounded-3xl sm:p-6 lg:col-span-1">

            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              High Priority
            </p>

            <p className="mt-2 text-2xl font-bold text-rose-300 sm:mt-3 sm:text-3xl">
              {statistics.highPriority}
            </p>

          </div>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:rounded-3xl sm:p-5 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="min-w-0 flex-1">

            <label
              htmlFor="technician-search"
              className="mb-2 block text-xs font-medium text-slate-500 sm:hidden"
            >
              Search tickets
            </label>

            <input
              id="technician-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search ticket, employee, department..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400 sm:rounded-2xl"
            />

          </div>

          {/* STATUS */}

          <div className="w-full sm:w-auto">

            <label
              htmlFor="technician-status"
              className="mb-2 block text-xs font-medium text-slate-500 sm:hidden"
            >
              Status
            </label>

            <select
              id="technician-status"
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-400 sm:rounded-2xl sm:min-w-[180px]"
            >

              <option value="All">
                All Active Tickets
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

          </div>

        </div>

        {/* =================================================
            TICKETS
        ================================================= */}

        <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:rounded-3xl sm:p-6">

          {/* =================================================
              LOADING
          ================================================= */}

          {isLoading ? (

            <div className="flex min-h-[300px] items-center justify-center sm:min-h-[470px]">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-sm text-slate-400">
                  Loading assigned tickets...
                </p>

              </div>

            </div>

          ) : filteredTickets.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <div className="flex min-h-[300px] items-center justify-center px-4 text-center sm:min-h-[470px]">

              <div>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                  🎫
                </div>

                <h3 className="mt-5 text-lg font-semibold sm:text-xl">
                  No assigned tickets
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  There are currently no tickets matching your filters.
                </p>

              </div>

            </div>

          ) : (

            <>

              {/* =================================================
                  DESKTOP TABLE
                  Visible from md and above
              ================================================= */}

              <div className="hidden overflow-x-auto rounded-3xl border border-slate-800 md:block">

                <table className="w-full min-w-[950px] text-left">

                  <thead className="bg-slate-950">

                    <tr>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Ticket
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Employee
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Department
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Category
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Priority
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-800">

                    {filteredTickets.map(
                      (ticket) => {

                        const ticketId =
                          ticket._id;

                        return (
                          <tr
                            key={
                              ticketId
                            }
                            className="transition hover:bg-slate-800/50"
                          >

                            {/* TICKET */}

                            <td className="px-5 py-5">

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/technician/tickets/${ticketId}`
                                  )
                                }
                                className="font-semibold text-cyan-300 hover:underline"
                              >
                                #
                                {String(
                                  ticketId
                                ).slice(-6)}
                              </button>

                              <p className="mt-1 max-w-[220px] truncate text-sm text-slate-400">
                                {
                                  ticket.title
                                }
                              </p>

                            </td>

                            {/* EMPLOYEE */}

                            <td className="px-5 py-5">

                              <p className="text-sm font-semibold text-slate-200">
                                {
                                  ticket
                                    .createdBy
                                    ?.fullName ||
                                  "Unknown"
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  ticket
                                    .createdBy
                                    ?.employeeId ||
                                  "No ID"
                                }
                              </p>

                            </td>

                            {/* DEPARTMENT */}

                            <td className="px-5 py-5 text-sm text-slate-300">
                              {
                                ticket
                                  .createdBy
                                  ?.department ||
                                "—"
                              }
                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-5 text-sm text-slate-300">
                              {
                                ticket.category
                              }
                            </td>

                            {/* PRIORITY */}

                            <td className="px-5 py-5">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  priorityClasses[
                                    ticket.priority
                                  ] ||
                                  "bg-slate-200 text-slate-800"
                                }`}
                              >
                                {
                                  ticket.priority
                                }
                              </span>

                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-5">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  statusClasses[
                                    ticket.status
                                  ] ||
                                  "bg-slate-200 text-slate-800"
                                }`}
                              >
                                {
                                  ticket.status
                                }
                              </span>

                            </td>

                            {/* CREATED */}

                            <td className="px-5 py-5 text-sm text-slate-400">
                              {formatDate(
                                ticket.createdAt
                              )}
                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-5">

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/technician/tickets/${ticketId}`
                                  )
                                }
                                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
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

              {/* =================================================
                  MOBILE CARDS
                  Visible below md
              ================================================= */}

              <div className="space-y-4 md:hidden">

                {filteredTickets.map(
                  (ticket) => {

                    const ticketId =
                      ticket._id;

                    return (
                      <article
                        key={
                          ticketId
                        }
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                      >

                        {/* CARD HEADER */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/technician/tickets/${ticketId}`
                                )
                              }
                              className="text-sm font-bold text-cyan-300 hover:underline"
                            >
                              #
                              {String(
                                ticketId
                              ).slice(-6)}
                            </button>

                            <h3 className="mt-1 break-words text-base font-semibold leading-6 text-white">
                              {
                                ticket.title ||
                                "Untitled Ticket"
                              }
                            </h3>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              statusClasses[
                                ticket.status
                              ] ||
                              "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {
                              ticket.status
                            }
                          </span>

                        </div>

                        {/* CARD INFORMATION */}

                        <div className="mt-4 space-y-3">

                          {/* EMPLOYEE */}

                          <div className="rounded-xl bg-slate-900 p-3">

                            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                              Employee
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-slate-200">
                              {
                                ticket
                                  .createdBy
                                  ?.fullName ||
                                "Unknown"
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                ticket
                                  .createdBy
                                  ?.employeeId ||
                                "No ID"
                              }
                            </p>

                          </div>

                          {/* DETAILS GRID */}

                          <div className="grid grid-cols-2 gap-3">

                            {/* DEPARTMENT */}

                            <div className="min-w-0 rounded-xl bg-slate-900 p-3">

                              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                                Department
                              </p>

                              <p className="mt-1 break-words text-sm text-slate-300">
                                {
                                  ticket
                                    .createdBy
                                    ?.department ||
                                  "—"
                                }
                              </p>

                            </div>

                            {/* CATEGORY */}

                            <div className="min-w-0 rounded-xl bg-slate-900 p-3">

                              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                                Category
                              </p>

                              <p className="mt-1 break-words text-sm text-slate-300">
                                {
                                  ticket.category ||
                                  "Other"
                                }
                              </p>

                            </div>

                            {/* PRIORITY */}

                            <div className="min-w-0 rounded-xl bg-slate-900 p-3">

                              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                                Priority
                              </p>

                              <div className="mt-2">

                                <span
                                  className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    priorityClasses[
                                      ticket.priority
                                    ] ||
                                    "bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  {
                                    ticket.priority ||
                                    "Medium"
                                  }
                                </span>

                              </div>

                            </div>

                            {/* CREATED */}

                            <div className="min-w-0 rounded-xl bg-slate-900 p-3">

                              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                                Created
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {formatDate(
                                  ticket.createdAt
                                )}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* VIEW BUTTON */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/technician/tickets/${ticketId}`
                            )
                          }
                          className="mt-4 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                          View Ticket Details
                        </button>

                      </article>
                    );
                  }
                )}

              </div>

            </>

          )}

        </section>

      </main>

    </div>
  );
};

// =====================================================
// EXPORT
// =====================================================

export default TechnicianDashboard;