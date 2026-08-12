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
// MENU ITEMS
// =====================================================

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Raise Ticket",
    href: "/raise-ticket",
  },
  {
    label: "My Tickets",
    href: "/my-tickets",
  },
  {
    label: "Profile",
    href: "/profile",
  },
];

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
  Critical:
    "bg-purple-100 text-purple-800",

  High:
    "bg-rose-100 text-rose-800",

  Medium:
    "bg-amber-100 text-amber-800",

  Low:
    "bg-emerald-100 text-emerald-800",
};

// =====================================================
// PRIORITY ORDER
// =====================================================

const priorityOrder = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

// =====================================================
// COMPONENT
// =====================================================

const MyTicket = () => {
  const navigate =
    useNavigate();

  // ===================================================
  // MENU
  // ===================================================

  const [menuOpen, setMenuOpen] =
    useState(false);

  // ===================================================
  // SEARCH
  // ===================================================

  const [query, setQuery] =
    useState("");

  // ===================================================
  // FILTER
  // ===================================================

  const [statusFilter, setStatusFilter] =
    useState("All");

  // ===================================================
  // SORT
  // ===================================================

  const [sortOption, setSortOption] =
    useState("Newest");

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
  // CLOSE STATE
  // ===================================================

  const [closingTicketId, setClosingTicketId] =
    useState(null);

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
  // SAFE RESPONSE PARSER
  // ===================================================

  const parseResponse =
    async (response) => {
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const text =
        await response.text();

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          return text
            ? JSON.parse(text)
            : {};
        } catch {
          throw new Error(
            "The server returned invalid JSON."
          );
        }
      }

      if (
        text
          .trim()
          .startsWith("<!DOCTYPE") ||
        text
          .trim()
          .startsWith("<html")
      ) {
        throw new Error(
          "Server returned an HTML page instead of JSON. Please check that the backend is running."
        );
      }

      return {
        message:
          text ||
          "Unexpected server response.",
      };
    };

  // ===================================================
  // FETCH TICKETS
  // ===================================================

  const fetchTickets =
    async () => {
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
          response.status ===
          401
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
              "Unable to fetch your tickets."
          );
        }

        setTickets(
          Array.isArray(
            result.tickets
          )
            ? result.tickets
            : []
        );
      } catch (error) {
        console.error(
          "Fetch tickets error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to connect to the server."
        );

        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchTickets();
  }, []);

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate =
    (dateValue) => {
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
  // CLOSE TICKET
  //
  // Employee can close their own ticket
  // regardless of whether it is:
  //
  // Open
  // In Progress
  // Resolved
  //
  // Closed tickets cannot be closed again.
  // ===================================================

  const handleCloseTicket =
    async (ticketId) => {
      const ticket =
        tickets.find(
          (item) =>
            String(
              item._id ||
                item.id
            ) ===
            String(ticketId)
        );

      if (!ticket) {
        setErrorMessage(
          "Ticket not found."
        );
        return;
      }

      if (
        ticket.status ===
        "Closed"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to close this ticket?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setClosingTicketId(
          ticketId
        );

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
            `${API_BASE_URL}/api/tickets/${ticketId}/close`,
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
          response.status ===
          401
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
              "Unable to close the ticket."
          );
        }

        // ------------------------------------------------
        // Update UI immediately
        // ------------------------------------------------

        setTickets(
          (currentTickets) =>
            currentTickets.map(
              (currentTicket) => {
                const currentId =
                  currentTicket._id ||
                  currentTicket.id;

                if (
                  String(
                    currentId
                  ) ===
                  String(
                    ticketId
                  )
                ) {
                  return {
                    ...currentTicket,

                    status:
                      "Closed",

                    updatedAt:
                      result.ticket
                        ?.updatedAt ||
                      new Date().toISOString(),
                  };
                }

                return currentTicket;
              }
            )
        );

      } catch (error) {
        console.error(
          "Close ticket error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to close the ticket."
        );
      } finally {
        setClosingTicketId(
          null
        );
      }
    };

  // ===================================================
  // FILTER + SORT
  // ===================================================

  const filtered =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      const filteredTickets =
        tickets.filter(
          (ticket) => {
            const id =
              String(
                ticket._id ||
                  ticket.id ||
                  ""
              ).toLowerCase();

            const title =
              String(
                ticket.title ||
                  ""
              ).toLowerCase();

            const category =
              String(
                ticket.category ||
                  ""
              ).toLowerCase();

            const status =
              ticket.status ||
              "Open";

            const matchesSearch =
              !search ||
              id.includes(
                search
              ) ||
              title.includes(
                search
              ) ||
              category.includes(
                search
              );

            const matchesStatus =
              statusFilter ===
                "All" ||
              status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );

      return [
        ...filteredTickets,
      ].sort(
        (a, b) => {
          // -------------------------------------------
          // Highest Priority
          // -------------------------------------------

          if (
            sortOption ===
            "Highest Priority"
          ) {
            return (
              (priorityOrder[
                b.priority
              ] || 0) -
              (priorityOrder[
                a.priority
              ] || 0)
            );
          }

          // -------------------------------------------
          // Oldest
          // -------------------------------------------

          if (
            sortOption ===
            "Oldest"
          ) {
            return (
              new Date(
                a.createdAt ||
                  0
              ).getTime() -
              new Date(
                b.createdAt ||
                  0
              ).getTime()
            );
          }

          // -------------------------------------------
          // Recently Updated
          // -------------------------------------------

          if (
            sortOption ===
            "Recently Updated"
          ) {
            return (
              new Date(
                b.updatedAt ||
                  b.createdAt ||
                  0
              ).getTime() -
              new Date(
                a.updatedAt ||
                  a.createdAt ||
                  0
              ).getTime()
            );
          }

          // -------------------------------------------
          // Newest
          // -------------------------------------------

          return (
            new Date(
              b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.createdAt ||
                0
            ).getTime()
          );
        }
      );
    }, [
      tickets,
      query,
      statusFilter,
      sortOption,
    ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-800 px-6 py-5">

        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
            ResolveIQ
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Support Operations Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-5">

          <Link
            to="/dashboard"
            className="hidden rounded-2xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 xl:inline-flex"
          >
            Dashboard
          </Link>

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (value) =>
                    !value
                )
              }
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5"
            >

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                U
              </span>

              <span>
                {menuOpen
                  ? "▲"
                  : "▼"}
              </span>

            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl">

                {menuItems.map(
                  (item) => (
                    <Link
                      key={
                        item.label
                      }
                      to={
                        item.href
                      }
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                      className="block border-b border-slate-800 px-5 py-3.5 text-sm hover:bg-slate-900"
                    >
                      {
                        item.label
                      }
                    </Link>
                  )
                )}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="block w-full px-5 py-3.5 text-left text-sm text-red-400 hover:bg-slate-900"
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto min-h-[calc(100vh-92px)] max-w-7xl px-6 py-12">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <h2 className="text-3xl font-bold">
              My Tickets{" "}
              <span className="text-base font-normal text-slate-400">
                ({tickets.length})
              </span>
            </h2>

            <p className="mt-3 text-base text-slate-400">
              Your submitted tickets and
              their current statuses.
            </p>

          </div>

          <Link
            to="/raise-ticket"
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            + Raise New Ticket
          </Link>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mb-6 flex min-h-[76px] flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 xl:flex-row xl:items-center">

          {/* STATUS */}

          <label className="flex items-center gap-3 text-sm text-slate-400">

            <span className="whitespace-nowrap">
              Filter Status
            </span>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
            >

              <option value="All">
                All
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

              <option value="Closed">
                Closed
              </option>

            </select>

          </label>

          {/* SEARCH */}

          <label className="relative flex-1">

            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
            >

              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <circle
                cx="11"
                cy="11"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />

            </svg>

            <input
              type="text"
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
              placeholder="Search by Ticket ID, Subject, or Category"
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 pl-11 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />

          </label>

          {/* SORT */}

          <label className="flex items-center gap-3 text-sm text-slate-400">

            <span>
              Sort
            </span>

            <select
              value={
                sortOption
              }
              onChange={(e) =>
                setSortOption(
                  e.target.value
                )
              }
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
            >

              <option value="Newest">
                Newest
              </option>

              <option value="Oldest">
                Oldest
              </option>

              <option value="Highest Priority">
                Highest Priority
              </option>

              <option value="Recently Updated">
                Recently Updated
              </option>

            </select>

          </label>

        </div>

        {/* =================================================
            STATIC RESULTS AREA
        ================================================= */}

        <div className="min-h-[520px] w-full">

          {/* LOADING */}

          {isLoading && (
            <section className="flex min-h-[520px] w-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-sm text-slate-400">
                  Loading your tickets...
                </p>

              </div>

            </section>
          )}

          {/* NO TICKETS */}

          {!isLoading &&
            tickets.length === 0 && (
              <section className="flex min-h-[520px] w-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90 p-12 text-center">

                <div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                    🎫
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    You haven't submitted any
                    support tickets yet.
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Submit your first ticket and
                    our support team will assist you.
                  </p>

                  <Link
                    to="/raise-ticket"
                    className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    + Raise New Ticket
                  </Link>

                </div>

              </section>
            )}

          {/* NO FILTER RESULTS */}

          {!isLoading &&
            tickets.length > 0 &&
            filtered.length === 0 && (
              <section className="flex min-h-[520px] w-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90 p-12 text-center">

                <div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                    🔍
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    No tickets found
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    There are no tickets matching
                    your current filter.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(
                        "All"
                      );

                      setQuery("");
                    }}
                    className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
                  >
                    Clear Filters
                  </button>

                </div>

              </section>
            )}

          {/* =================================================
              TICKETS TABLE
          ================================================= */}

          {!isLoading &&
            filtered.length > 0 && (
              <section className="flex min-h-[520px] w-full flex-col rounded-3xl border border-slate-800 bg-slate-900/90 p-6">

                <div className="min-h-0 flex-1 overflow-x-auto rounded-3xl border border-slate-800">

                  <table className="min-w-[1100px] w-full text-left">

                    <thead className="sticky top-0 z-10 bg-slate-950">

                      <tr>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Ticket ID
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Subject
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Category
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Priority
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Created At
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Last Updated
                        </th>

                        <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {filtered.map(
                        (ticket) => {
                          const ticketId =
                            ticket._id ||
                            ticket.id;

                          const status =
                            ticket.status ||
                            "Open";

                          const priority =
                            ticket.priority ||
                            "Medium";

                          const isClosing =
                            String(
                              closingTicketId
                            ) ===
                            String(
                              ticketId
                            );

                          return (
                            <tr
                              key={
                                ticketId
                              }
                              className="transition hover:bg-slate-800/50"
                            >

                              {/* ID */}

                              <td className="px-6 py-5">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/tickets/${ticketId}`
                                    )
                                  }
                                  className="font-semibold text-emerald-300 hover:underline"
                                >
                                  #
                                  {String(
                                    ticketId
                                  ).slice(
                                    -6
                                  )}
                                </button>

                              </td>

                              {/* SUBJECT */}

                              <td className="px-6 py-5">

                                <p className="max-w-[260px] truncate text-sm font-semibold text-slate-200">
                                  {ticket.title ||
                                    "Untitled Ticket"}
                                </p>

                              </td>

                              {/* CATEGORY */}

                              <td className="px-6 py-5 text-sm text-slate-300">
                                {ticket.category ||
                                  "Other"}
                              </td>

                              {/* PRIORITY */}

                              <td className="px-6 py-5">

                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    priorityClasses[
                                      priority
                                    ] ||
                                    "bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  {
                                    priority
                                  }
                                </span>

                              </td>

                              {/* STATUS */}

                              <td className="px-6 py-5">

                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    statusClasses[
                                      status
                                    ] ||
                                    "bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  {
                                    status
                                  }
                                </span>

                              </td>

                              {/* CREATED */}

                              <td className="px-6 py-5 text-sm text-slate-400">
                                {formatDate(
                                  ticket.createdAt
                                )}
                              </td>

                              {/* UPDATED */}

                              <td className="px-6 py-5 text-sm text-slate-400">
                                {formatDate(
                                  ticket.updatedAt ||
                                    ticket.createdAt
                                )}
                              </td>

                              {/* ACTION */}

                              <td className="px-6 py-5">

                                <div className="flex items-center gap-2">

                                  {/* VIEW */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/tickets/${ticketId}`
                                      )
                                    }
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                                  >
                                    View
                                  </button>

                                  {/* =================================================
                                      CLOSE BUTTON
                                      
                                      Employee can close ANY of their own tickets.
                                      Admin can also close tickets from admin UI.
                                  ================================================= */}

                                  {status !==
                                    "Closed" && (
                                    <button
                                      type="button"
                                      disabled={
                                        isClosing
                                      }
                                      onClick={() =>
                                        handleCloseTicket(
                                          ticketId
                                        )
                                      }
                                      className="inline-flex min-w-[78px] items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isClosing
                                        ? "Closing..."
                                        : "Close"}
                                    </button>
                                  )}

                                  {/* CLOSED */}

                                  {status ===
                                    "Closed" && (
                                    <span className="inline-flex min-w-[78px] items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-400">
                                      Closed
                                    </span>
                                  )}

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* FOOTER */}

                <div className="mt-5 flex h-6 shrink-0 items-center justify-between text-sm text-slate-400">

                  <span>
                    Showing{" "}
                    {
                      filtered.length
                    }{" "}
                    of{" "}
                    {
                      tickets.length
                    }{" "}
                    tickets
                  </span>

                </div>

              </section>
            )}

        </div>

      </main>

    </div>
  );
};

export default MyTicket;