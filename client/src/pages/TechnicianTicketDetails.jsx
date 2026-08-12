import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

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
// COMPONENT
// =====================================================

const TechnicianTicketDetails = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  // ===================================================
  // TICKET STATE
  // ===================================================

  const [
    ticket,
    setTicket,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  // ===================================================
  // COMMENT STATE
  // ===================================================

  const [
    comments,
    setComments,
  ] = useState([]);

  const [
    commentMessage,
    setCommentMessage,
  ] = useState("");

  const [
    commentsLoading,
    setCommentsLoading,
  ] = useState(true);

  const [
    commentsError,
    setCommentsError,
  ] = useState("");

  const [
    submittingComment,
    setSubmittingComment,
  ] = useState(false);

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
  // FETCH TICKET
  // ===================================================

  const fetchTicket =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const token =
          getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
            `http://localhost:3000/api/tickets/${id}`,
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
            "Server returned an unexpected response."
          );
        }

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

        if (
          response.status ===
          403
        ) {
          throw new Error(
            result.message ||
              "You are not authorized to view this ticket."
          );
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load ticket."
          );
        }

        setTicket(
          result.ticket
        );

      } catch (error) {
        console.error(
          "Get technician ticket error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load ticket."
        );

      } finally {
        setIsLoading(false);
      }
    };

  // ===================================================
  // FETCH COMMENTS
  // ===================================================

  const fetchComments =
    async () => {
      try {
        setCommentsLoading(true);
        setCommentsError("");

        const token =
          getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
            `http://localhost:3000/api/tickets/${id}/comments`,
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
            "Server returned an unexpected response."
          );
        }

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

        if (
          response.status ===
          403
        ) {
          throw new Error(
            result.message ||
              "You do not have permission to view these comments."
          );
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
          "Get comments error:",
          error
        );

        setCommentsError(
          error.message ||
            "Unable to load comments."
        );

      } finally {
        setCommentsLoading(
          false
        );
      }
    };

  // ===================================================
  // LOAD TICKET + COMMENTS
  // ===================================================

  useEffect(() => {
    fetchTicket();
    fetchComments();
  }, [id]);

  // ===================================================
  // UPDATE STATUS
  // ===================================================

  const handleStatusChange =
    async (
      newStatus
    ) => {
      if (!ticket) {
        return;
      }

      if (
        ticket.status ===
        "Closed"
      ) {
        return;
      }

      // -----------------------------------------------
      // VALIDATE TRANSITION
      // -----------------------------------------------

      if (
        ticket.status ===
          "Open" &&
        newStatus ===
          "Resolved"
      ) {
        setErrorMessage(
          "Move the ticket to In Progress before resolving it."
        );

        return;
      }

      if (
        ticket.status ===
          "Resolved" &&
        newStatus ===
          "Open"
      ) {
        setErrorMessage(
          "A resolved ticket cannot be moved back to Open."
        );

        return;
      }

      try {
        setUpdatingStatus(
          true
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
            `http://localhost:3000/api/tickets/${id}/status`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                status:
                  newStatus,
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
            "Server returned an unexpected response."
          );
        }

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

        if (
          response.status ===
          403
        ) {
          throw new Error(
            result.message ||
              "You are not authorized to update this ticket."
          );
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to update ticket status."
          );
        }

        setTicket(
          result.ticket
        );

      } catch (error) {
        console.error(
          "Update status error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to update ticket status."
        );

      } finally {
        setUpdatingStatus(
          false
        );
      }
    };

  // ===================================================
  // ADD COMMENT
  // ===================================================

  const handleAddComment =
    async (event) => {
      event.preventDefault();

      const trimmedMessage =
        commentMessage.trim();

      if (!trimmedMessage) {
        setCommentsError(
          "Please enter a comment."
        );

        return;
      }

      if (
        trimmedMessage.length >
        2000
      ) {
        setCommentsError(
          "Comment cannot exceed 2000 characters."
        );

        return;
      }

      if (
        ticket?.status ===
        "Closed"
      ) {
        setCommentsError(
          "Comments cannot be added to a closed ticket."
        );

        return;
      }

      try {
        setSubmittingComment(
          true
        );

        setCommentsError("");

        const token =
          getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await fetch(
            `http://localhost:3000/api/tickets/${id}/comments`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                message:
                  trimmedMessage,
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
            "Server returned an unexpected response."
          );
        }

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

        if (
          response.status ===
          403
        ) {
          throw new Error(
            result.message ||
              "You do not have permission to comment on this ticket."
          );
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to add comment."
          );
        }

        if (
          result.comment
        ) {
          setComments(
            (previous) => [
              ...previous,
              result.comment,
            ]
          );
        }

        setCommentMessage("");

      } catch (error) {
        console.error(
          "Add comment error:",
          error
        );

        setCommentsError(
          error.message ||
            "Unable to add comment."
        );

      } finally {
        setSubmittingComment(
          false
        );
      }
    };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate =
    (value) => {
      if (!value) {
        return "—";
      }

      const date =
        new Date(value);

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
  // FORMAT DATE + TIME
  // ===================================================

  const formatDateTime =
    (value) => {
      if (!value) {
        return "—";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
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

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">

        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6">

          <div className="text-center">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

            <p className="mt-4 text-sm text-slate-400">
              Loading ticket...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (
    errorMessage &&
    !ticket
  ) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">

        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6">

          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center sm:rounded-3xl sm:p-8">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-2xl">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold sm:text-2xl">
              Unable to load ticket
            </h2>

            <p className="mt-3 break-words text-sm leading-6 text-slate-400">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/technician/dashboard"
                )
              }
              className="mt-6 w-full rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 sm:w-auto sm:rounded-2xl"
            >
              Back to Dashboard
            </button>

          </div>

        </main>

      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  // ===================================================
  // VALUES
  // ===================================================

  const status =
    ticket.status ||
    "Open";

  const priority =
    ticket.priority ||
    "Medium";

  const employee =
    ticket.createdBy ||
    {};

  const technician =
    ticket.assignedTo ||
    {};

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-slate-800">

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">

          <div className="min-w-0">

            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">
              ResolveIQ
            </p>

            <h1 className="mt-1 truncate text-xl font-semibold sm:mt-2 sm:text-3xl">
              Technician Ticket Details
            </h1>

          </div>

          <div className="flex w-full gap-2 sm:w-auto sm:gap-3">

            <Link
              to="/technician/dashboard"
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold transition hover:bg-slate-800 sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
            >
              My Tickets
            </Link>

            <Link
              to="/profile"
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold transition hover:bg-slate-800 sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex flex-1 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 sm:flex-none sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
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

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/technician/dashboard"
            )
          }
          className="mb-5 text-left text-sm leading-6 text-slate-400 transition hover:text-white sm:mb-6"
        >
          ← Back to My Assigned Tickets
        </button>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-300 sm:px-5">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            TICKET HEADER
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6 lg:p-8">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                <span className="max-w-full break-all rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold text-slate-400 sm:text-xs">
                  #
                  {String(
                    ticket._id
                  ).slice(-8)}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs ${
                    statusClasses[
                      status
                    ] ||
                    "bg-slate-200 text-slate-800"
                  }`}
                >
                  {status}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs ${
                    priorityClasses[
                      priority
                    ] ||
                    "bg-slate-200 text-slate-800"
                  }`}
                >
                  {priority}
                </span>

              </div>

              <h2 className="mt-4 break-words text-2xl font-bold leading-tight sm:mt-5 sm:text-3xl">
                {
                  ticket.title
                }
              </h2>

              <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                Category:{" "}
                <span className="text-slate-300">
                  {
                    ticket.category ||
                    "Other"
                  }
                </span>
              </p>

            </div>

            {/* STATUS CONTROL */}

            <div className="w-full shrink-0 xl:w-[340px]">

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:rounded-3xl sm:p-5">

                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Update Status
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:gap-3">

                  <button
                    type="button"
                    disabled={
                      updatingStatus ||
                      status ===
                        "Open" ||
                      status ===
                        "Closed"
                    }
                    onClick={() =>
                      handleStatusChange(
                        "Open"
                      )
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition sm:rounded-2xl ${
                      status ===
                      "Open"
                        ? "bg-amber-500 text-slate-950"
                        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingStatus ||
                      status ===
                        "In Progress" ||
                      status ===
                        "Closed"
                    }
                    onClick={() =>
                      handleStatusChange(
                        "In Progress"
                      )
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition sm:rounded-2xl ${
                      status ===
                      "In Progress"
                        ? "bg-sky-500 text-slate-950"
                        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    disabled={
                      updatingStatus ||
                      status ===
                        "Resolved" ||
                      status ===
                        "Closed"
                    }
                    onClick={() =>
                      handleStatusChange(
                        "Resolved"
                      )
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition sm:rounded-2xl ${
                      status ===
                      "Resolved"
                        ? "bg-emerald-500 text-slate-950"
                        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Resolved
                  </button>

                </div>

                {status ===
                  "Closed" && (
                  <p className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-xs leading-5 text-slate-400">
                    This ticket is closed and can no longer be modified.
                  </p>
                )}

                {updatingStatus && (
                  <p className="mt-4 text-center text-xs text-slate-500">
                    Updating ticket status...
                  </p>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-3">

          {/* MAIN CONTENT */}

          <div className="min-w-0 space-y-5 sm:space-y-6 xl:col-span-2">

            {/* DESCRIPTION */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6 lg:p-7">

              <h3 className="text-lg font-semibold sm:text-xl">
                Description
              </h3>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:mt-5 sm:rounded-2xl sm:p-5">

                <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-300">
                  {
                    ticket.description ||
                    "No description provided."
                  }
                </p>

              </div>

            </section>

            {/* =================================================
                COMMENTS / CONVERSATION
            ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6 lg:p-7">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-lg font-semibold sm:text-xl">
                    Ticket Conversation
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    Communicate with the employee and other authorized users.
                  </p>

                </div>

                <span className="w-fit rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                  {comments.length}{" "}
                  {comments.length ===
                  1
                    ? "comment"
                    : "comments"}
                </span>

              </div>

              {/* COMMENT ERROR */}

              {commentsError && (
                <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-300">
                  {
                    commentsError
                  }
                </div>
              )}

              {/* COMMENT LIST */}

              <div className="mt-5 space-y-4">

                {commentsLoading ? (

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-10 text-center">

                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                    <p className="mt-3 text-xs text-slate-500">
                      Loading conversation...
                    </p>

                  </div>

                ) : comments.length ===
                  0 ? (

                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-10 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-xl">
                      💬
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-300">
                      No comments yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Start the conversation by adding a comment.
                    </p>

                  </div>

                ) : (

                  comments.map(
                    (
                      comment
                    ) => {

                      const author =
                        comment.author ||
                        {};

                      const initial =
                        author.fullName
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                        "?";

                      return (
                        <article
                          key={
                            comment._id
                          }
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5"
                        >

                          <div className="flex items-start gap-3 sm:gap-4">

                            {/* AVATAR */}

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-300 sm:h-11 sm:w-11">
                              {
                                initial
                              }
                            </div>

                            {/* COMMENT */}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">

                                <p className="break-words text-sm font-semibold text-slate-200">
                                  {
                                    author.fullName ||
                                    "Unknown User"
                                  }
                                </p>

                                {author.role && (
                                  <span className="w-fit rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                    {
                                      author.role
                                    }
                                  </span>
                                )}

                                <span className="text-[11px] text-slate-600">
                                  {formatDateTime(
                                    comment.createdAt
                                  )}
                                </span>

                              </div>

                              <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-300">
                                {
                                  comment.message
                                }
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
                className="mt-5 border-t border-slate-800 pt-5 sm:mt-6 sm:pt-6"
              >

                <label
                  htmlFor="comment-message"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Add a comment
                </label>

                <textarea
                  id="comment-message"
                  value={
                    commentMessage
                  }
                  onChange={(
                    event
                  ) =>
                    setCommentMessage(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    submittingComment ||
                    status ===
                      "Closed"
                  }
                  rows={4}
                  maxLength={2000}
                  placeholder={
                    status ===
                    "Closed"
                      ? "Comments are disabled for closed tickets."
                      : "Write an update, question, or resolution note..."
                  }
                  className="mt-3 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl"
                />

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-[11px] text-slate-600">
                    {
                      commentMessage.length
                    }{" "}
                    / 2000 characters
                  </p>

                  <button
                    type="submit"
                    disabled={
                      submittingComment ||
                      status ===
                        "Closed" ||
                      !commentMessage.trim()
                    }
                    className="w-full rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-2xl"
                  >
                    {submittingComment
                      ? "Adding..."
                      : "Add Comment"}
                  </button>

                </div>

              </form>

            </section>

            {/* TICKET INFORMATION */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6 lg:p-7">

              <h3 className="text-lg font-semibold sm:text-xl">
                Ticket Information
              </h3>

              <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5">

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Ticket ID
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-slate-200">
                    #
                    {
                      ticket._id
                    }
                  </p>

                </div>

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Category
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-200">
                    {
                      ticket.category ||
                      "Other"
                    }
                  </p>

                </div>

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Priority
                  </p>

                  <div className="mt-2">

                    <span
                      className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${
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

                  </div>

                </div>

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Created
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-200">
                    {formatDateTime(
                      ticket.createdAt
                    )}
                  </p>

                </div>

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-200">
                    {formatDateTime(
                      ticket.updatedAt
                    )}
                  </p>

                </div>

                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:rounded-2xl sm:p-5">

                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    Current Status
                  </p>

                  <div className="mt-2">

                    <span
                      className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${
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

                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="min-w-0 space-y-5 sm:space-y-6">

            {/* REQUESTER */}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:rounded-3xl sm:p-6">

              <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                Requester
              </h3>

              <div className="mt-5">

                <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-lg font-bold text-cyan-300 sm:h-12 sm:w-12">
                    {
                      employee.fullName
                        ?.charAt(
                          0
                        )
                        ?.toUpperCase() ||
                      "U"
                    }
                  </div>

                  <div className="min-w-0">

                    <p className="break-words text-base font-semibold">
                      {
                        employee.fullName ||
                        "Unknown Employee"
                      }
                    </p>

                    <p className="break-all text-xs leading-5 text-slate-500">
                      {
                        employee.email ||
                        "No email"
                      }
                    </p>

                  </div>

                </div>

                <div className="mt-5 space-y-3">

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Employee ID
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-300">
                      {
                        employee.employeeId ||
                        "Not available"
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Department
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-300">
                      {
                        employee.department ||
                        "Not specified"
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">

                    <p className="text-xs text-slate-500">
                      Region
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-300">
                      {
                        employee.region ||
                        "Not specified"
                      }
                    </p>

                  </div>

                </div>

              </div>

            </section>

           
          </aside>

        </div>

      </main>

    </div>
  );
};

// =====================================================
// EXPORT
// =====================================================

export default TechnicianTicketDetails;