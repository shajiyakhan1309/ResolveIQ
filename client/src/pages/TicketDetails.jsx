import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
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
// FORMAT DATE
// =====================================================

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
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

// =====================================================
// FORMAT DATE + TIME
// =====================================================

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// =====================================================
// TICKET DETAILS
// =====================================================

const TicketDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  // ===================================================
  // TICKET STATE
  // ===================================================

  const [ticket, setTicket] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  // ===================================================
  // COMMENT STATE
  // ===================================================

  const [comments, setComments] =
    useState([]);

  const [commentsLoading, setCommentsLoading] =
    useState(true);

  const [commentsError, setCommentsError] =
    useState("");

  const [commentMessage, setCommentMessage] =
    useState("");

  const [submittingComment, setSubmittingComment] =
    useState(false);

  // ===================================================
  // FETCH TICKET
  // ===================================================

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const currentToken =
        localStorage.getItem(
          "resolveiq-token"
        );

      if (!currentToken) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${id}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${currentToken}`,
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
          text ||
            "Unexpected server response."
        );
      }

      // -----------------------------------------------
      // UNAUTHORIZED
      // -----------------------------------------------

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

      // -----------------------------------------------
      // NOT FOUND
      // -----------------------------------------------

      if (
        response.status === 404
      ) {
        setTicket(null);

        setErrorMessage(
          "Ticket not found."
        );

        return;
      }

      // -----------------------------------------------
      // OTHER ERROR
      // -----------------------------------------------

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to fetch ticket details."
        );
      }

      // -----------------------------------------------
      // STORE TICKET
      // -----------------------------------------------

      setTicket(
        result.ticket
      );

    } catch (error) {
      console.error(
        "Get Ticket Details Error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to connect to the server."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // FETCH COMMENTS
  // ===================================================

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      setCommentsError("");

      const currentToken =
        localStorage.getItem(
          "resolveiq-token"
        );

      if (!currentToken) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${id}/comments`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${currentToken}`,
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
          text ||
            "Unexpected server response."
        );
      }

      // -----------------------------------------------
      // UNAUTHORIZED
      // -----------------------------------------------

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
            "Unable to load comments."
        );
      }

      setComments(
        Array.isArray(
          result.comments
        )
          ? result.comments
          : []
      );

    } catch (error) {
      console.error(
        "Get Comments Error:",
        error
      );

      setCommentsError(
        error.message ||
          "Unable to load comments."
      );

    } finally {
      setCommentsLoading(false);
    }
  };

  // ===================================================
  // FETCH EVERYTHING
  // ===================================================

  useEffect(() => {
    fetchTicket();
    fetchComments();
  }, [id]);

  // ===================================================
  // COPY TICKET ID
  // ===================================================

  const handleCopyId = async () => {
    if (!ticket?._id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(ticket._id)
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);

    } catch (error) {
      console.error(
        "Copy ID Error:",
        error
      );
    }
  };

  // ===================================================
  // ADD COMMENT
  // ===================================================

  const handleAddComment = async (
    event
  ) => {
    event.preventDefault();

    const message =
      commentMessage.trim();

    if (!message) {
      setCommentsError(
        "Please enter a comment."
      );

      return;
    }

    if (message.length > 2000) {
      setCommentsError(
        "Comment cannot exceed 2000 characters."
      );

      return;
    }

    // -----------------------------------------------
    // CLOSED TICKET
    // -----------------------------------------------

    if (
      ticket?.status ===
      "Closed"
    ) {
      setCommentsError(
        "This ticket is closed. You cannot add new comments."
      );

      return;
    }

    try {
      setSubmittingComment(true);
      setCommentsError("");

      const currentToken =
        localStorage.getItem(
          "resolveiq-token"
        );

      if (!currentToken) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${id}/comments`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${currentToken}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message,
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
          text ||
            "Unexpected server response."
        );
      }

      // -----------------------------------------------
      // UNAUTHORIZED
      // -----------------------------------------------

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
            "Unable to add comment."
        );
      }

      // -----------------------------------------------
      // ADD COMMENT TO UI
      // -----------------------------------------------

      if (result.comment) {
        setComments(
          (previousComments) => [
            ...previousComments,
            result.comment,
          ]
        );
      } else {
        // If backend doesn't return
        // the created comment, fetch again.
        await fetchComments();
      }

      setCommentMessage("");

    } catch (error) {
      console.error(
        "Add Comment Error:",
        error
      );

      setCommentsError(
        error.message ||
          "Unable to add comment."
      );

    } finally {
      setSubmittingComment(false);
    }
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">

        <nav className="border-b border-slate-800">

          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">

            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
              ResolveIQ
            </p>

            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Support Operations Dashboard
            </h1>

          </div>

        </nav>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="mt-4 text-sm text-slate-400">
                Loading ticket details...
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ===================================================
  // TICKET NOT FOUND
  // ===================================================

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">

        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6">

          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
              🎫
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Ticket Not Found
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {errorMessage ||
                `We couldn't find ticket ${id}.`}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/my-tickets"
                )
              }
              className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              ← Back to My Tickets
            </button>

          </div>

        </main>

      </div>
    );
  }

  // ===================================================
  // TICKET VALUES
  // ===================================================

  const ticketId =
    ticket._id ||
    ticket.id;

  const shortTicketId =
    ticketId
      ? String(ticketId).slice(-6)
      : "—";

  const employee =
    ticket.createdBy ||
    {};

  const technician =
    ticket.assignedTo ||
    null;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-slate-800">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="min-w-0">

            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
              ResolveIQ
            </p>

            <h1 className="mt-2 text-xl font-semibold sm:text-3xl">
              Support Operations Dashboard
            </h1>

          </div>

          <div className="flex w-full gap-2 sm:w-auto">

            <Link
              to="/dashboard"
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 sm:flex-none sm:rounded-2xl sm:px-5 sm:text-sm"
            >
              Dashboard
            </Link>

            <Link
              to="/my-tickets"
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 sm:flex-none sm:rounded-2xl sm:px-5 sm:text-sm"
            >
              My Tickets
            </Link>

          </div>

        </div>

      </nav>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/my-tickets"
            )
          }
          className="mb-6 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          ← Back to My Tickets
        </button>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-3">

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
                  Ticket
                </span>

                <button
                  type="button"
                  onClick={
                    handleCopyId
                  }
                  className="rounded-xl bg-slate-950 px-3 py-1.5 text-sm font-semibold text-emerald-300 transition hover:bg-slate-800"
                >
                  #{shortTicketId}
                </button>

                {copied && (
                  <span className="text-xs font-medium text-emerald-400">
                    Copied!
                  </span>
                )}

              </div>

              <h2 className="mt-4 break-words text-2xl font-bold text-white sm:text-3xl">
                {ticket.title ||
                  "Untitled Ticket"}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-3">

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

              </div>

              <p className="mt-4 text-sm text-slate-400">
                Category:{" "}
                <span className="text-slate-300">
                  {ticket.category ||
                    "Other"}
                </span>
              </p>

            </div>

            <div className="w-full xl:w-auto">

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">

                  <div>

                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Created
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDateTime(
                        ticket.createdAt
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Last Updated
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDateTime(
                        ticket.updatedAt
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          {/* =================================================
              LEFT
          ================================================= */}

          <main className="min-w-0 space-y-6 xl:col-span-2">

            {/* DESCRIPTION */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-lg font-semibold">
                Description
              </h3>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

                <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-300">
                  {ticket.description ||
                    "No description provided."}
                </p>

              </div>

            </section>

            {/* =================================================
                CONVERSATION
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-lg font-semibold">
                    Ticket Conversation
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    Communicate with the technician handling your ticket.
                  </p>

                </div>

                <span className="w-fit rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                  {comments.length}{" "}
                  {comments.length === 1
                    ? "comment"
                    : "comments"}
                </span>

              </div>

              {/* COMMENT ERROR */}

              {commentsError && (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-300">
                  {commentsError}
                </div>
              )}

              {/* COMMENTS */}

              <div className="mt-5 space-y-4">

                {commentsLoading ? (

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-10 text-center">

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                    <p className="mt-3 text-xs text-slate-500">
                      Loading conversation...
                    </p>

                  </div>

                ) : comments.length === 0 ? (

                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-10 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-xl">
                      💬
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-300">
                      No comments yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The technician can use this section to communicate with you.
                    </p>

                  </div>

                ) : (

                  comments.map(
                    (comment) => {

                      const author =
                        comment.author ||
                        {};

                      const initial =
                        author.fullName
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        "?";

                      const isTechnician =
                        author.role ===
                        "Technician";

                      return (
                        <article
                          key={
                            comment._id
                          }
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5"
                        >

                          <div className="flex items-start gap-3 sm:gap-4">

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:h-11 sm:w-11 ${
                                isTechnician
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-cyan-500/10 text-cyan-300"
                              }`}
                            >
                              {initial}
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">

                                <p className="break-words text-sm font-semibold text-slate-200">
                                  {author.fullName ||
                                    "Unknown User"}
                                </p>

                                {author.role && (
                                  <span className="w-fit rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                    {author.role}
                                  </span>
                                )}

                                <span className="text-[11px] text-slate-600">
                                  {formatDateTime(
                                    comment.createdAt
                                  )}
                                </span>

                              </div>

                              <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-300">
                                {comment.message}
                              </p>

                            </div>

                          </div>

                        </article>
                      );
                    }
                  )

                )}

              </div>

              {/* =================================================
                  ADD COMMENT
              ================================================= */}

              <form
                onSubmit={
                  handleAddComment
                }
                className="mt-6 border-t border-slate-800 pt-6"
              >

                <label
                  htmlFor="employee-comment"
                  className="text-sm font-semibold text-slate-300"
                >
                  Reply
                </label>

                <textarea
                  id="employee-comment"
                  value={
                    commentMessage
                  }
                  onChange={(event) =>
                    setCommentMessage(
                      event.target.value
                    )
                  }
                  disabled={
                    submittingComment ||
                    ticket.status ===
                      "Closed"
                  }
                  rows={4}
                  maxLength={2000}
                  placeholder={
                    ticket.status ===
                    "Closed"
                      ? "This ticket is closed."
                      : "Write a message to the technician..."
                  }
                  className="mt-3 w-full resize-y rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-[11px] text-slate-600">
                    {commentMessage.length}
                    {" "}
                    / 2000 characters
                  </p>

                  <button
                    type="submit"
                    disabled={
                      submittingComment ||
                      ticket.status ===
                        "Closed" ||
                      !commentMessage.trim()
                    }
                    className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {submittingComment
                      ? "Sending..."
                      : "Send Reply"}
                  </button>

                </div>

              </form>

            </section>

            {/* =================================================
                TICKET INFORMATION
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-lg font-semibold">
                Ticket Information
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Category
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-200">
                    {ticket.category ||
                      "Other"}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Priority
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      priorityClasses[
                        ticket.priority
                      ] ||
                      "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {ticket.priority ||
                      "Medium"}
                  </span>

                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[
                        ticket.status
                      ] ||
                      "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {ticket.status ||
                      "Open"}
                  </span>

                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Assigned Technician
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-200">
                    {technician?.fullName ||
                      technician?.email ||
                      "Not assigned"}
                  </p>

                </div>

              </div>

            </section>

          </main>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <aside className="min-w-0 space-y-6">

            {/* =================================================
                EMPLOYEE PROFILE
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Your Information
              </h3>

              <div className="mt-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-lg font-bold text-cyan-300">
                    {employee.fullName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "U"}
                  </div>

                  <div className="min-w-0">

                    <p className="break-words text-base font-semibold text-slate-200">
                      {employee.fullName ||
                        "Employee"}
                    </p>

                    <p className="break-all text-xs text-slate-500">
                      {employee.email ||
                        "Email unavailable"}
                    </p>

                  </div>

                </div>

                <div className="mt-5 space-y-3">

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Employee ID
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-300">
                      {employee.employeeId ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Department
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-300">
                      {employee.department ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Region
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-300">
                      {employee.region ||
                        "Not specified"}
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                TECHNICIAN
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Assigned Technician
              </h3>

              {technician ? (

                <div className="mt-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-bold text-emerald-300">
                      {technician.fullName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "T"}
                    </div>

                    <div className="min-w-0">

                      <p className="break-words text-base font-semibold text-slate-200">
                        {technician.fullName ||
                          "Technician"}
                      </p>

                      <p className="break-all text-xs text-slate-500">
                        {technician.email ||
                          "Email unavailable"}
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 space-y-3">

                    <div className="rounded-xl bg-slate-950/60 p-3">

                      <p className="text-xs text-slate-500">
                        Technician ID
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-300">
                        {technician.employeeId ||
                          "Not specified"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-950/60 p-3">

                      <p className="text-xs text-slate-500">
                        Department
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-300">
                        {technician.department ||
                          "Not specified"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-950/60 p-3">

                      <p className="text-xs text-slate-500">
                        Region
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-300">
                        {technician.region ||
                          "Not specified"}
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-5 text-center">

                  <p className="text-sm font-semibold text-slate-300">
                    No technician assigned
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    An administrator will assign a technician to this ticket.
                  </p>

                </div>

              )}

            </section>

            {/* =================================================
                TIMELINE
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Ticket Timeline
              </h3>

              <div className="mt-5 space-y-5">

                <div className="flex gap-3">

                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />

                  <div>

                    <p className="text-sm font-semibold text-slate-200">
                      Ticket Created
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        ticket.createdAt
                      )}
                    </p>

                  </div>

                </div>

                {ticket.updatedAt &&
                  ticket.updatedAt !==
                    ticket.createdAt && (

                    <div className="flex gap-3">

                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />

                      <div>

                        <p className="text-sm font-semibold text-slate-200">
                          Ticket Updated
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            ticket.updatedAt
                          )}
                        </p>

                      </div>

                    </div>
                  )}

              </div>

            </section>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl sm:p-6">

              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Actions
              </h3>

              <div className="mt-4 space-y-3">

                <Link
                  to="/my-tickets"
                  className="flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  ← My Tickets
                </Link>

                <Link
                  to="/raise-ticket"
                  className="flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  + Raise New Ticket
                </Link>

              </div>

            </section>

          </aside>

        </div>

      </main>

    </div>
  );
};

export default TicketDetails;