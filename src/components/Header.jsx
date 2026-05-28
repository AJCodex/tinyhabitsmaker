import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import StarCounter from './StarCounter'
import { signOut } from '../firebase'

export default function Header({ totalStars, user, isAdmin }) {
  const firstName = (user?.displayName || 'there').split(' ')[0]
  return (
    <header className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-6 sm:px-6">
      <div className="min-w-0 flex-1">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="truncate text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl"
        >
          Hi {firstName}!{' '}
          <motion.span
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4 }}
            className="inline-block"
          >
            👋
          </motion.span>
        </motion.h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          Let's make today amazing
          {isAdmin && (
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
              Admin
            </span>
          )}
        </p>
      </div>
      <StarCounter value={totalStars} />
      <UserMenu user={user} />
    </header>
  )
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="block h-11 w-11 overflow-hidden rounded-full ring-2 ring-white shadow-md transition hover:ring-brand-300"
        aria-label="Account menu"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-purple-500 text-white">
            {(user?.displayName || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-gray-100"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-sm font-semibold text-gray-800">{user?.displayName}</div>
            <div className="truncate text-xs text-gray-400">{user?.email}</div>
          </div>
          <button
            onClick={() => signOut()}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Sign out
          </button>
        </motion.div>
      )}
    </div>
  )
}
