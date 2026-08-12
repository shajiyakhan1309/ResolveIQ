import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import API_BASE_URL from '../config/api'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // =====================================================
  // LOGIN
  // =====================================================

  const onSubmit = async (data) => {
    const { email, password } = data

    try {
      setIsLoading(true)
      clearErrors('root')

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      )

      const result = await response.json()

      // =================================================
      // BACKEND ERROR
      // =================================================

      if (!response.ok) {
        setError('root', {
          type: 'auth',
          message:
            result.message ||
            'Invalid email or password. Please try again.',
        })

        return
      }

      // =================================================
      // CHECK TOKEN
      // =================================================

      if (!result.token) {
        setError('root', {
          type: 'server',
          message:
            'Login successful, but no authentication token was received.',
        })

        return
      }

      // =================================================
      // STORE JWT TOKEN
      // =================================================

      localStorage.setItem(
        'resolveiq-token',
        result.token
      )

      // =================================================
      // STORE LOGGED-IN USER
      // =================================================

      if (result.user) {
        localStorage.setItem(
          'resolveiq-logged-in-user',
          JSON.stringify(result.user)
        )
      }

      // =================================================
      // REDIRECT ACCORDING TO ROLE
      // =================================================

      if (result.user?.role === 'Admin') {
        navigate('/admin/dashboard')
      } else if (result.user?.role === 'Technician') {
        navigate('/technician/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)

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

        {/* =================================================
            HEADER
        ================================================= */}

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

        {/* =================================================
            LOGIN CARD
        ================================================= */}

        <section className="mx-auto max-w-2xl rounded-[28px] bg-white/95 p-8 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200/60">

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-500">
              Sign in
            </p>

            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Access your ResolveIQ dashboard
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use your work email to log in and manage support workflows.
            </p>
          </div>

          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >

            {/* General Error */}

            {errors.root && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.root.message}
              </p>
            )}

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value:
                      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
              />

              {errors.email && (
                <p className="text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                <p className="text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>

            {/* =================================================
                SIGNUP
            ================================================= */}

            <div className="text-sm text-black">
              <Link
                to="/signup"
                className="font-medium text-cyan-600 hover:text-cyan-700"
              >
                Don't have an account? Sign up
              </Link>
            </div>

          </form>
        </section>
      </div>
    </main>
  )
}

export default Login