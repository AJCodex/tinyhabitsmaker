import { motion } from 'framer-motion'
import { useState } from 'react'
import { signInWithGoogle } from '../firebase'

export default function SignInScreen() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Sign-in failed')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-pop ring-1 ring-gray-100"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-7xl"
        >
          ⭐
        </motion.div>
        <h1 className="mt-4 text-3xl font-bold text-gray-800">TinyHabitsMaker</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to start building amazing habits!
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={busy}
          onClick={handleSignIn}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <GoogleIcon />
          {busy ? 'Signing in…' : 'Continue with Google'}
        </motion.button>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <p className="mt-6 text-[11px] text-gray-400">
          We only store your name & avatar so you can see your own habits.
        </p>
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}
