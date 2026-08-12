import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Raise Ticket', href: '/raise-ticket' },
  { label: 'My Tickets', href: '/my-tickets' },
  { label: 'Profile', href: '/profile' },
]

const statusClasses = {
  Open: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-sky-100 text-sky-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Closed: 'bg-slate-200 text-slate-700',
}

const priorityClasses = {
  High: 'bg-rose-100 text-rose-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-emerald-100 text-emerald-800',
}

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [tickets, setTickets] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  /*
   * Get logged-in user from localStorage
   */
  const loggedInUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem(
        'resolveiq-logged-in-user'
      )

      return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
      console.error('Failed to read logged-in user:', error)
      return null
    }
  }, [])

  /*
   * Get JWT token
   */
  const token = localStorage.getItem('resolveiq-token')

  /*
   * Get user's initials
   */
  const userInitials = useMemo(() => {
    if (!loggedInUser?.fullName) {
      return 'U'
    }

    const nameParts = loggedInUser.fullName
      .trim()
      .split(' ')
      .filter(Boolean)

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase()
  }, [loggedInUser])

  /*
   * Fetch dashboard statistics and tickets
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setError('You are not logged in. Please login again.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')

        /*
         * Fetch dashboard statistics
         */
        const dashboardResponse = await fetch(
          'http://localhost:3000/api/dashboard',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const dashboardResult =
          await dashboardResponse.json()

        if (dashboardResponse.status === 401) {
          localStorage.removeItem('resolveiq-token')
          localStorage.removeItem('resolveiq-logged-in-user')

          navigate('/login')
          return
        }

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardResult.message ||
              'Failed to load dashboard statistics.'
          )
        }

        setDashboardStats(dashboardResult.stats)

        /*
         * Fetch employee tickets
         */
        const ticketsResponse = await fetch(
          'http://localhost:3000/api/tickets',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const ticketsResult = await ticketsResponse.json()

        if (ticketsResponse.status === 401) {
          localStorage.removeItem('resolveiq-token')
          localStorage.removeItem('resolveiq-logged-in-user')

          navigate('/login')
          return
        }

        if (!ticketsResponse.ok) {
          throw new Error(
            ticketsResult.message ||
              'Failed to load tickets.'
          )
        }

        /*
         * Your API may return:
         *
         * {
         *   success: true,
         *   tickets: [...]
         * }
         *
         * So we handle that format.
         */
        const apiTickets = Array.isArray(
          ticketsResult.tickets
        )
          ? ticketsResult.tickets
          : []

        setTickets(apiTickets)

      } catch (error) {
        console.error(
          'Dashboard loading error:',
          error
        )

        setError(
          error.message ||
            'Unable to load dashboard data.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [token, navigate])

  /*
   * Format tickets for the table
   */
  const formattedTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket._id
        ? `#${ticket._id.slice(-6).toUpperCase()}`
        : '#N/A',

      subject:
        ticket.title ||
        ticket.subject ||
        'Untitled Ticket',

      category:
        ticket.category || 'General',

      priority: ticket.priority
        ? ticket.priority.charAt(0).toUpperCase() +
          ticket.priority.slice(1).toLowerCase()
        : 'Medium',

      status: ticket.status || 'Open',

      date: ticket.createdAt
        ? new Date(
            ticket.createdAt
          ).toLocaleDateString()
        : 'N/A',

      originalId: ticket._id,
    }))
  }, [tickets])

  /*
   * Show latest five tickets
   */
  const recentTickets = useMemo(() => {
    return formattedTickets.slice(0, 5)
  }, [formattedTickets])

  /*
   * Dashboard metrics
   *
   * Primary values come from the backend.
   */
  const metrics = useMemo(() => {
    if (!dashboardStats) {
      return [
        {
          title: 'Total Tickets',
          value: 0,
          description:
            'All support requests submitted',
        },
        {
          title: 'Open Tickets',
          value: 0,
          description:
            'Requests waiting for agent action',
        },
        {
          title: 'In Progress',
          value: 0,
          description:
            'Tickets currently being handled',
        },
        {
          title: 'Resolved',
          value: 0,
          description:
            'Issues resolved successfully',
        },
      ]
    }

    return [
      {
        title: 'Total Tickets',
        value: dashboardStats.totalTickets ?? 0,
        description:
          'All support requests submitted',
      },
      {
        title: 'Open Tickets',
        value: dashboardStats.openTickets ?? 0,
        description:
          'Requests waiting for agent action',
      },
      {
        title: 'In Progress',
        value:
          dashboardStats.inProgressTickets ?? 0,
        description:
          'Tickets currently being handled',
      },
      {
        title: 'Resolved',
        value:
          dashboardStats.resolvedTickets ?? 0,
        description:
          'Issues resolved successfully',
      },
    ]
  }, [dashboardStats])

  /*
   * Calculate high-priority tickets from real tickets.
   *
   * This replaces the old hardcoded "2".
   */
  const highPriorityCount = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.priority?.toLowerCase() === 'high'
    ).length
  }, [tickets])

  /*
   * Calculate tickets that are currently open.
   *
   * This replaces the old hardcoded "6 awaiting response".
   */
  const awaitingResponseCount = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status === 'Open'
    ).length
  }, [tickets])

  /*
   * Logout
   */
  const handleLogout = () => {
    localStorage.removeItem('resolveiq-token')
    localStorage.removeItem('resolveiq-logged-in-user')

    navigate('/login')
  }

  /*
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

          <p className="mt-4 text-sm text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-800 px-6 py-4">

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            ResolveIQ
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Support Operations Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">

          {/* Raise Ticket */}
          <Link
            to="/raise-ticket"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            + Raise New Ticket
          </Link>

          {/* Profile Menu */}
          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                {userInitials}
              </span>

              <span className="hidden text-slate-300 sm:block">
                {loggedInUser?.fullName ||
                  'Employee'}
              </span>

              <span className="text-slate-400">
                {menuOpen ? '▲' : '▼'}
              </span>

            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/30">

                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="block border-b border-slate-800 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-900 hover:text-white"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                  >
                    {item.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 text-left text-sm text-red-400 transition hover:bg-slate-900 hover:text-red-300"
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-6">

        {/* Error */}
        {error && (
          <section className="mb-6 rounded-3xl border border-red-900/50 bg-red-950/40 p-5">
            <p className="text-sm font-medium text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
            >
              Retry
            </button>
          </section>
        )}

        {/* Overview */}
        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/20">

          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] lg:items-center">

            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Overview
              </p>

              <h2 className="mt-3 text-4xl font-semibold text-white">
                Ticket performance and workload summary
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Monitor your support requests with exact
                ticket counts, progress status, and the
                latest issues that need attention.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* High Priority */}
              <article className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                  High-Priority Tickets
                </p>

                <p className="mt-4 text-4xl font-semibold text-white">
                  {highPriorityCount}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  High-priority requests
                </p>
              </article>

              {/* Awaiting Response */}
              <article className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                  Awaiting Response
                </p>

                <p className="mt-4 text-4xl font-semibold text-white">
                  {awaitingResponseCount}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Tickets currently awaiting action
                </p>
              </article>

              {/* Total */}
              <article className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                  Total Requests
                </p>

                <p className="mt-4 text-4xl font-semibold text-white">
                  {dashboardStats?.totalTickets ?? 0}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Total tickets raised by you
                </p>
              </article>

              {/* Resolved */}
              <article className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                  Resolved
                </p>

                <p className="mt-4 text-4xl font-semibold text-white">
                  {dashboardStats?.resolvedTickets ?? 0}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Issues resolved successfully
                </p>
              </article>

            </div>
          </div>
        </section>

        {/* Dashboard Metrics */}
        <section className="grid gap-6 xl:grid-cols-4">

          {metrics.map((metric) => (
            <article
              key={metric.title}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                {metric.title}
              </p>

              <p className="mt-5 text-4xl font-semibold text-white">
                {metric.value}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {metric.description}
              </p>
            </article>
          ))}

        </section>

        {/* Recent Tickets */}
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Recent Tickets
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-white">
                Latest support requests
              </h3>
            </div>

            <Link
              to="/my-tickets"
              className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              View all tickets →
            </Link>

          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800">

            {recentTickets.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-lg font-medium text-slate-300">
                  No tickets found
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  You haven't raised any support tickets yet.
                </p>

                <Link
                  to="/raise-ticket"
                  className="mt-5 inline-flex rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Raise Your First Ticket
                </Link>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-800 text-left">

                <thead className="bg-slate-950">
                  <tr>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Ticket ID
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Category
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Priority
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Created At
                    </th>

                  </tr>
                </thead>

                <tbody className="bg-slate-900">

                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.originalId || ticket.id}
                      className="border-b border-slate-800 transition hover:bg-slate-800/50"
                    >

                      <td className="px-6 py-4 text-sm text-slate-200">
                        {ticket.id}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {ticket.subject}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {ticket.category}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            priorityClasses[
                              ticket.priority
                            ] ||
                            'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ticket.priority}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusClasses[
                              ticket.status
                            ] ||
                            'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ticket.status}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-sm text-slate-400">
                        {ticket.date}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            )}

          </div>
        </section>

      </main>
    </div>
  )
}

export default Dashboard