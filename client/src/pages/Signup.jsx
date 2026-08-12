import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import API_BASE_URL from "../config/api";

const Signup = () => {
  const [signupMessage, setSignupMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      email: '',
      password: '',
      confirmPassword: '',
      subscribe: false,
    },
  })

  const password = watch('password', '')

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setSignupMessage('')
      clearErrors('email')
      clearErrors('root')

      const fullName =
        `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

      const response = await fetch(
        `${API_BASE_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email: data.email.trim().toLowerCase(),
            password: data.password,

            // Public signup is ALWAYS Employee
            role: 'Employee',
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError('email', {
            type: 'manual',
            message:
              result.message ||
              'An account with this email already exists.',
          })
        } else {
          setError('root', {
            type: 'server',
            message:
              result.message ||
              'Unable to create your account. Please try again.',
          })
        }

        return
      }

      setSignupMessage(
        result.message || 'Account created successfully!'
      )

      // Don't automatically log the user in.
      // Send them to Login so they can authenticate normally.
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      console.error('Signup error:', error)

      setError('root', {
        type: 'server',
        message:
          'Unable to connect to the server. Please make sure the backend is running.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">

        {/* Header */}
        <header className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-cyan-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            ResolveIQ
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Enterprise support made simple and beautiful.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Fast, secure onboarding and login flows for your support team —
            designed to feel professional on every device.
          </p>
        </header>

        {/* Signup Card */}
        <section className="mx-auto max-w-2xl rounded-[28px] bg-white/95 p-8 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200/60">

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-500">
              Create account
            </p>

            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Get started with ResolveIQ
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Register your team and start managing support requests with a
              professional dashboard.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >

            {/* Success message */}
            {signupMessage && (
              <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
                {signupMessage}
              </p>
            )}

            {/* General error */}
            {errors.root && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            {/* First Name + Last Name */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* First Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  First name
                </label>

                <input
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                  placeholder="First name"
                  autoComplete="given-name"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                />

                {errors.firstName && (
                  <p className="text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                </label>

                <input
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                  placeholder="Last name"
                  autoComplete="family-name"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                />

                {errors.lastName && (
                  <p className="text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Country / Region
              </label>

              <select
                {...register('country', {
                  required: 'Country is required',
                })}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="">
                  Select Country / Region
                </option>

                <option value="usa">
                  United States
                </option>

                <option value="canada">
                  Canada
                </option>

                <option value="uk">
                  United Kingdom
                </option>

                <option value="australia">
                  Australia
                </option>

                <option value="india">
                  India
                </option>

                <option value="korea">
                  Korea
                </option>

                <option value="china">
                  China
                </option>

                <option value="japan">
                  Japan
                </option>
              </select>

              {errors.country && (
                <p className="text-sm text-red-500">
                  {errors.country.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>

              <input
                type="text"
                value="Employee"
                readOnly
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none"
              />

              <p className="text-xs text-slate-500">
                New accounts are registered as Employees. Technician and
                Admin accounts are created by an administrator.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value:
                      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
              />

              {errors.email && (
                <p className="text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Passwords */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message:
                          'Password must be at least 8 characters',
                      },
                      pattern: {
                        value:
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message:
                          'Password must include uppercase, lowercase, number, and special character',
                      },
                    })}
                    placeholder="Create password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-cyan-600"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.5 12c1.158 3.7 4.4 6.5 8.5 6.5 1.06 0 2.07-.18 3.01-.5M6.6 6.6A10.48 10.48 0 0112 5.5c4.1 0 7.34 2.8 8.5 6.5a10.51 10.51 0 01-2.73 3.96M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    {...register('confirmPassword', {
                      required:
                        'Please confirm your password',
                      validate: (value) =>
                        value === password ||
                        'Passwords do not match',
                    })}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-cyan-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.5 12c1.158 3.7 4.4 6.5 8.5 6.5 1.06 0 2.07-.18 3.01-.5M6.6 6.6A10.48 10.48 0 0112 5.5c4.1 0 7.34 2.8 8.5 6.5a10.51 10.51 0 01-2.73 3.96M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>

            {/* Login */}
            <div className="text-sm text-black">
              <Link
                to="/login"
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Already have an account? Login
              </Link>
            </div>

          </form>
        </section>
      </div>
    </main>
  )
}

export default Signup