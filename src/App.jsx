import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { AnimatePresence, motion } from 'framer-motion'
import { db, auth, onAuthStateChanged } from './firebase'
import { isoDate, isEditableDate } from './utils/dates'
import { seedSampleData } from './utils/seed'
import Header from './components/Header'
import Tabs from './components/Tabs'
import TodayTab from './components/TodayTab'
import DashboardTab from './components/DashboardTab'
import HabitsTab from './components/HabitsTab'
import AdminTab from './components/AdminTab'
import SignInScreen from './components/SignInScreen'

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null) // Firebase auth user
  const [profile, setProfile] = useState(null) // Firestore users/{uid} doc
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState([])
  const [tab, setTab] = useState('today')
  const [error, setError] = useState(null)

  // Auth state -> ensure users/{uid} exists, then load profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setHabits([])
        setCompletions([])
        setAuthReady(true)
        return
      }
      try {
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            displayName: u.displayName || 'Friend',
            email: u.email || null,
            photoURL: u.photoURL || null,
            isAdmin: false,
            createdAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
          })
        } else {
          // touch lastSeenAt — don't await, fire and forget
          setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true })
        }
      } catch (err) {
        console.error('Profile init failed', err)
        setError(err.message)
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  // Subscribe to own profile doc (for isAdmin live updates)
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => setError(err.message),
    )
    return unsub
  }, [user])

  // Subscribe to OWN habits and completions
  useEffect(() => {
    if (!user) return
    const unsubHabits = onSnapshot(
      query(collection(db, 'habits'), where('userId', '==', user.uid)),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Sort client-side by createdAt (ascending). New docs without a server
        // timestamp yet land at the end.
        rows.sort((a, b) => {
          const ta = a.createdAt?.seconds ?? Infinity
          const tb = b.createdAt?.seconds ?? Infinity
          return ta - tb
        })
        setHabits(rows)
      },
      (err) => setError(err.message),
    )
    const unsubComps = onSnapshot(
      query(collection(db, 'completions'), where('userId', '==', user.uid)),
      (snap) => setCompletions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message),
    )
    return () => {
      unsubHabits()
      unsubComps()
    }
  }, [user])

  const isAdmin = !!profile?.isAdmin

  const compsByHabit = useMemo(() => {
    const map = {}
    for (const c of completions) {
      ;(map[c.habitId] ||= new Set()).add(c.date)
    }
    return map
  }, [completions])

  // On-time completions only (loggedOnTime !== false). Used for streak math.
  // Legacy docs without the field are treated as on-time so existing stats stay intact.
  const onTimeByHabit = useMemo(() => {
    const map = {}
    for (const c of completions) {
      if (c.loggedOnTime === false) continue
      ;(map[c.habitId] ||= new Set()).add(c.date)
    }
    return map
  }, [completions])

  // Set of "habitId|date" pairs that were backfilled (used by heatmap dot).
  const backfilledKeys = useMemo(() => {
    const s = new Set()
    for (const c of completions) {
      if (c.loggedOnTime === false) s.add(`${c.habitId}|${c.date}`)
    }
    return s
  }, [completions])

  const compsByDate = useMemo(() => {
    const map = {}
    for (const c of completions) map[c.date] = (map[c.date] || 0) + 1
    return map
  }, [completions])

  const totalStars = useMemo(() => {
    const pointsById = Object.fromEntries(habits.map((h) => [h.id, h.points || 1]))
    return completions.reduce((sum, c) => sum + (pointsById[c.habitId] || 0), 0)
  }, [completions, habits])

  async function addHabit({ name, emoji, points }) {
    if (!user || habits.length >= 5) return
    await addDoc(collection(db, 'habits'), {
      userId: user.uid,
      name,
      emoji,
      points,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteHabit(habit) {
    if (!confirm(`Delete "${habit.name}"? (past completions stay in your stats)`)) return
    await deleteDoc(doc(db, 'habits', habit.id))
  }

  async function handleSeed() {
    if (!user || habits.length > 0) return
    try {
      await seedSampleData(user.uid)
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleToday(habit) {
    return toggleDay(habit, isoDate())
  }

  // Generic toggle for any date. Yesterday allowed for backfill (loggedOnTime=false);
  // today writes loggedOnTime=true. Older dates are silently rejected.
  async function toggleDay(habit, dateIso) {
    if (!user) return
    if (!isEditableDate(dateIso)) return
    const id = `${habit.id}_${dateIso}`
    const ref = doc(db, 'completions', id)
    const done = compsByHabit[habit.id]?.has(dateIso)
    if (done) {
      await deleteDoc(ref)
      return
    }
    await setDoc(ref, {
      userId: user.uid,
      habitId: habit.id,
      date: dateIso,
      completedAt: serverTimestamp(),
      loggedOnTime: dateIso === isoDate(),
    })
  }

  if (!authReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-float text-5xl">⭐</div>
      </div>
    )
  }

  if (!user) return <SignInScreen />

  const tabs = [
    { id: 'today', label: 'Today', emoji: '🏠' },
    { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
    { id: 'habits', label: 'Habits', emoji: '⚙️' },
    ...(isAdmin ? [{ id: 'admin', label: 'Everyone', emoji: '👥' }] : []),
  ]

  // If admin tab was active and user lost admin, fall back
  const activeTab = tabs.find((t) => t.id === tab) ? tab : 'today'

  return (
    <div className="min-h-full">
      <Header totalStars={totalStars} user={user} isAdmin={isAdmin} />
      <Tabs active={activeTab} onChange={setTab} tabs={tabs} />

      {error && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-600">{error}</div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'today' && (
              <TodayTab habits={habits} compsByHabit={compsByHabit} onToggle={toggleToday} />
            )}
            {activeTab === 'dashboard' && (
              <DashboardTab
                habits={habits}
                compsByHabit={compsByHabit}
                onTimeByHabit={onTimeByHabit}
                compsByDate={compsByDate}
                backfilledKeys={backfilledKeys}
                totalStars={totalStars}
                onToggleDay={toggleDay}
              />
            )}
            {activeTab === 'habits' && (
              <HabitsTab habits={habits} onAdd={addHabit} onDelete={deleteHabit} onSeed={handleSeed} />
            )}
            {activeTab === 'admin' && isAdmin && <AdminTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
