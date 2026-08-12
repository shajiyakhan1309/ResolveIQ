import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Raise Ticket', href: '/raise-ticket' },
  { label: 'My Tickets', href: '/my-tickets' },
  { label: 'Profile', href: '/profile' },
]

const RaiseTicket = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const fileInputRef = useRef(null)

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      category: 'Other',
      description: '',
      priority: 'Medium',
    },
  })

  const attachmentRegister = register('attachment')

  const token = localStorage.getItem('resolveiq-token')

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem('resolveiq-token')
    localStorage.removeItem('resolveiq-logged-in-user')

    navigate('/login')
  }

  // =====================================================
  // FILE SELECTION
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null)
      event.target.value = ''

      setErrorMessage(
        'Please select an image file only.'
      )

      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null)
      event.target.value = ''

      setErrorMessage(
        'Image size must be less than 5 MB.'
      )

      return
    }

    setErrorMessage('')
    setSelectedFile(file)
  }

  // =====================================================
  // REMOVE FILE
  // =====================================================

  const removeSelectedFile = () => {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // =====================================================
  // SUBMIT TICKET
  // =====================================================

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      setSubmittedMessage('')
      setErrorMessage('')

      if (!token) {
        setErrorMessage(
          'Your session has expired. Please login again.'
        )

        navigate('/login')
        return
      }

      /*
       * These values exactly match Ticket.js:
       *
       * Category:
       * Hardware
       * Software
       * Network
       * Account
       * Other
       *
       * Priority:
       * Low
       * Medium
       * High
       */

      const ticketData = {
        title: data.title.trim(),
        category: data.category,
        description: data.description.trim(),
        priority: data.priority,
      }

      console.log(
        'Sending ticket data:',
        ticketData
      )

      const response = await fetch(
        'http://localhost:3000/api/tickets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(ticketData),
        }
      )

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem(
          'resolveiq-token'
        )

        localStorage.removeItem(
          'resolveiq-logged-in-user'
        )

        navigate('/login')
        return
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Unable to create the ticket.'
        )
      }

      setSubmittedMessage(
        result.message ||
          'Ticket submitted successfully!'
      )

      reset({
        title: '',
        category: 'Other',
        description: '',
        priority: 'Medium',
      })

      removeSelectedFile()

      setTimeout(() => {
        navigate('/my-tickets')
      }, 1000)

    } catch (error) {
      console.error(
        'Create ticket error:',
        error
      )

      setErrorMessage(
        error.message ||
          'Unable to connect to the server. Please make sure the backend is running.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* =================================================
          NAVIGATION
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
            className="hidden rounded-2xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:inline-flex"
          >
            Dashboard
          </Link>

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                U
              </span>

              <span className="text-slate-400">
                {menuOpen ? '▲' : '▼'}
              </span>

            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/40">

                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="block border-b border-slate-800 px-5 py-3.5 text-sm text-slate-200 transition hover:bg-slate-900 hover:text-white"
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
                  className="block w-full px-5 py-3.5 text-left text-sm text-red-400 transition hover:bg-slate-900 hover:text-red-300"
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

      </nav>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Submit Support Ticket
          </h2>

          <p className="mt-3 text-base text-slate-400">
            Describe your issue and our support team will
            assist you.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* =================================================
              FORM
          ================================================= */}

          <section className="lg:col-span-2">

            <form
              className="space-y-8 rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-xl shadow-slate-950/20"
              onSubmit={handleSubmit(onSubmit)}
            >

              {/* Success */}

              {submittedMessage && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
                  {submittedMessage}
                </div>
              )}

              {/* Error */}

              {errorMessage && (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* =================================================
                  TITLE + CATEGORY
              ================================================= */}

              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">

                <div>

                  <label className="block text-base font-medium text-slate-400">
                    Ticket Title
                  </label>

                  <input
                    type="text"
                    {...register('title', {
                      required:
                        'Ticket title is required',
                    })}
                    placeholder="Issue title"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-3.5 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500"
                  />

                  {errors.title && (
                    <p className="mt-2 text-sm text-rose-300">
                      {errors.title.message}
                    </p>
                  )}

                </div>

                {/* Category */}

                <div>

                  <label className="block text-base font-medium text-slate-400">
                    Category
                  </label>

                  <select
                    {...register('category')}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-3.5 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500"
                  >

                    <option value="Hardware">
                      Hardware
                    </option>

                    <option value="Software">
                      Software
                    </option>

                    <option value="Network">
                      Network
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div>

                <label className="block text-base font-medium text-slate-400">
                  Description
                </label>

                <textarea
                  {...register('description', {
                    required:
                      'Please provide a detailed description.',
                  })}
                  placeholder="Detailed description of the issue"
                  rows={7}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-4 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500"
                />

                {errors.description && (
                  <p className="mt-2 text-sm text-rose-300">
                    {errors.description.message}
                  </p>
                )}

              </div>

              {/* =================================================
                  PRIORITY + ATTACHMENT
              ================================================= */}

              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">

                {/* Priority */}

                <div>

                  <label className="block text-base font-medium text-slate-400">
                    Priority
                  </label>

                  <select
                    {...register('priority')}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-3.5 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500"
                  >

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                  </select>

                </div>

                {/* Attachment */}

                <div>

                  <label className="block text-base font-medium text-slate-400">
                    Attachment
                  </label>

                  <div className="mt-2">

                    <input
                      type="file"
                      accept="image/*"
                      {...attachmentRegister}
                      ref={(element) => {
                        attachmentRegister.ref(
                          element
                        )

                        fileInputRef.current =
                          element
                      }}
                      onChange={(event) => {
                        attachmentRegister.onChange(
                          event
                        )

                        handleFileChange(event)
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="w-full rounded-xl border border-dashed border-slate-600 bg-slate-800 px-5 py-4 text-base font-medium text-slate-200 transition hover:border-cyan-400 hover:bg-slate-800/80"
                    >
                      📎 Choose Image
                    </button>

                    {selectedFile ? (

                      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-5 py-4">

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-slate-200">
                            {selectedFile.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {(
                              selectedFile.size /
                              1024 /
                              1024
                            ).toFixed(2)}{' '}
                            MB
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={
                            removeSelectedFile
                          }
                          className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
                        >
                          Remove
                        </button>

                      </div>

                    ) : (

                      <p className="mt-2 text-xs text-slate-500">
                        PNG, JPG, JPEG, WEBP — maximum
                        5 MB
                      </p>

                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="flex gap-5 pt-2">

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-cyan-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-950/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : 'Submit Ticket'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset({
                      title: '',
                      category: 'Other',
                      description: '',
                      priority: 'Medium',
                    })

                    removeSelectedFile()

                    setSubmittedMessage('')
                    setErrorMessage('')
                  }}
                  className="flex-1 rounded-2xl border border-slate-700 px-5 py-3.5 text-base font-semibold text-slate-100 transition hover:bg-slate-800 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>

          {/* =================================================
              HELPER CARD
          ================================================= */}

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/10">

            <h3 className="text-xl font-semibold">
              Tips For Faster Resolution
            </h3>

            <ul className="mt-5 space-y-4 text-base text-slate-300">

              <li className="flex items-start gap-3">
                <span className="text-lg text-emerald-400">
                  ✓
                </span>

                <span>
                  Include error messages
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-lg text-emerald-400">
                  ✓
                </span>

                <span>
                  Attach screenshots
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-lg text-emerald-400">
                  ✓
                </span>

                <span>
                  Mention affected software
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-lg text-emerald-400">
                  ✓
                </span>

                <span>
                  Select correct priority
                </span>
              </li>

            </ul>

            {/* Response Targets */}

            <div className="mt-8">

              <h4 className="text-base font-semibold">
                Response Targets
              </h4>

              <ul className="mt-4 space-y-3 text-sm text-slate-300">

                <li className="flex items-center justify-between">
                  <span>High</span>

                  <span className="text-orange-300">
                    Within 4 hours
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span>Medium</span>

                  <span className="text-yellow-300">
                    Within 24 hours
                  </span>
                </li>

                <li className="flex items-center justify-between">
                  <span>Low</span>

                  <span className="text-emerald-300">
                    Within 48 hours
                  </span>
                </li>

              </ul>

            </div>

            <p className="mt-8 text-sm leading-6 text-slate-400">
              Providing clear details helps our team
              respond faster.
            </p>

          </aside>

        </div>

      </main>

    </div>
  )
}

export default RaiseTicket