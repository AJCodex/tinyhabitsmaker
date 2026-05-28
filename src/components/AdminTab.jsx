import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { isoDate, currentStreak, longestStreak, lastNDays } from '../utils/dates'

// Admin-only view: snapshots ALL users, ALL habits, ALL completions
// and shows each user's progress card.
export default function AdminTab() {
  const [users, setUsers] = useState([])
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, 'users'),
      (snap) => setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setErr(e.message),
    )
    const u2 = onSnapshot(
      collection(db, 'habits'),
      (snap) => setHabits(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setErr(e.message),
    )
    const u3 = onSnapshot(
      collection(db, 'completions'),
      (snap) => setCompletions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setErr(e.message),
    )
    return () => {
      u1()
      u2()
      u3()
    }
  }, [])

  const today = isoDate()

  const perUser = useMemo(() => {
    const byUser = {}
    for (const u of users) {
      byUser[u.id] = {
        user: u,
        habits: [],
        comps: [],
      }
    }
    for (const h of habits) {
      if (byUser[h.userId]) byUser[h.userId].habits.push(h)
    }
    for (const c of completions) {
      if (byUser[c.userId]) byUser[c.userId].comps.push(c)
    }
    return Object.values(byUser).map(({ user, habits, comps }) => {
      const compsByHabit = {}
      const compsByDate = {}
      for (const c of comps) {
        ;(compsByHabit[c.habitId] ||= new Set()).add(c.date)
        compsByDate[c.date] = (compsByDate[c.date] || 0) + 1
      }
      const pointsById = Object.fromEntries(habits.map((h) => [h.id, h.points || 1]))
      const stars = comps.reduce((s, c) => s + (pointsById[c.habitId] || 0), 0)
      let best = 0
      let curSum = 0
      for (const h of habits) {
        const set = compsByHabit[h.id] || new Set()
        const lng = longestStreak(set)
        if (lng > best) best = lng
        curSum += currentStreak(set)
      }
      const doneToday = habits.filter((h) => compsByHabit[h.id]?.has(today)).length
      const total = habits.length
      const pct = total === 0 ? 0 : Math.round((doneToday / total) * 100)
      const lastDate = comps.reduce((a, c) => (c.date > a ? c.date : a), '')
      const week = lastNDays(7, compsByDate)
      return { user, stars, best, curSum, doneToday, total, pct, lastDate, week }
    })
  }, [users, habits, completions, today])

  // Sort: most active first
  const sorted = useMemo(
    () => [...perUser].sort((a, b) => b.stars - a.stars),
    [perUser],
  )

  if (err) {
    return (
      <div className="rounded-3xl bg-white p-5 text-sm text-red-600 shadow-soft">
        Couldn't load admin data: {err}
        <p className="mt-2 text-xs text-gray-500">
          Make sure your Firestore rules allow admins to read all collections (see SETUP.md).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white shadow-pop">
        <div className="text-xs font-bold uppercase tracking-wider opacity-90">Admin view</div>
        <div className="mt-1 text-xl font-bold">
          {users.length} {users.length === 1 ? 'user' : 'users'} · {completions.length} total check-ins
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-gray-500 shadow-soft">
          No users yet.
        </div>
      )}

      {sorted.map((row, idx) => (
        <motion.div
          key={row.user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100"
        >
          <div className="flex items-center gap-3">
            <Avatar user={row.user} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-lg font-bold text-gray-800">
                  {row.user.displayName || 'Unnamed'}
                </div>
                {row.user.isAdmin && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {row.lastDate ? `Last check-in: ${row.lastDate}` : 'No check-ins yet'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-500">{row.pct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400">today</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Stars" value={`⭐ ${row.stars}`} />
            <Stat label="Best streak" value={`🏆 ${row.best}`} />
            <Stat label="Today" value={`${row.doneToday}/${row.total}`} />
          </div>

          <MiniBars week={row.week} />
        </motion.div>
      ))}
    </div>
  )
}

function Avatar({ user }) {
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="h-12 w-12 shrink-0 rounded-full ring-2 ring-brand-200"
      />
    )
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-purple-500 text-xl text-white">
      {(user.displayName || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-2 py-2">
      <div className="text-base font-bold text-gray-800">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
    </div>
  )
}

function MiniBars({ week }) {
  const max = Math.max(1, ...week.map((d) => d.count))
  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {week.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-brand-500 to-purple-500"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 2 }}
          />
        </div>
      ))}
    </div>
  )
}
