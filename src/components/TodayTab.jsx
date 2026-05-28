import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { isoDate, currentStreak } from '../utils/dates'
import { STREAK_MILESTONES } from '../utils/motivation'

function fireConfetti(big = false) {
  const opts = big
    ? { particleCount: 160, spread: 90, startVelocity: 45, origin: { y: 0.6 } }
    : { particleCount: 70, spread: 70, origin: { y: 0.65 } }
  confetti(opts)
  if (big) {
    setTimeout(() => confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.7 } }), 150)
    setTimeout(() => confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.7 } }), 250)
  }
}

export default function TodayTab({ habits, compsByHabit, onToggle }) {
  const today = isoDate()
  const total = habits.length
  const done = habits.filter((h) => compsByHabit[h.id]?.has(today)).length

  async function handleToggle(habit) {
    const wasDone = compsByHabit[habit.id]?.has(today)
    await onToggle(habit)
    if (!wasDone) {
      // After marking done — fire confetti based on new streak
      const nextSet = new Set(compsByHabit[habit.id] || [])
      nextSet.add(today)
      const streak = currentStreak(nextSet)
      fireConfetti(STREAK_MILESTONES.has(streak))
    }
  }

  return (
    <div className="space-y-5">
      <ProgressBanner done={done} total={total} />

      {habits.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {habits.map((h, idx) => {
            const isDone = compsByHabit[h.id]?.has(today)
            const streak = currentStreak(compsByHabit[h.id] || new Set())
            return (
              <motion.li
                key={h.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200 }}
              >
                <button
                  onClick={() => handleToggle(h)}
                  className={`group flex w-full items-center gap-4 rounded-3xl p-4 text-left shadow-soft ring-1 transition-all ${
                    isDone
                      ? 'bg-gradient-to-r from-brand-100 to-purple-100 ring-brand-200'
                      : 'bg-white ring-gray-100 hover:-translate-y-0.5 hover:shadow-pop hover:ring-brand-200'
                  }`}
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    animate={isDone ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl shadow-md transition ${
                      isDone
                        ? 'bg-gradient-to-br from-brand-400 to-purple-500 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-400 group-hover:from-brand-100 group-hover:to-purple-100'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isDone ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                        >
                          ✓
                        </motion.span>
                      ) : (
                        <motion.span key="emoji" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          {h.emoji}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-gray-800">{h.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      {streak > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-600">
                          🔥 {streak}-day streak
                        </span>
                      ) : (
                        <span className="text-gray-400">Start a streak today!</span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        +{h.points || 1} ⭐
                      </span>
                    </div>
                  </div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ProgressBanner({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
          </div>
          <div className="text-xl font-bold text-gray-800">
            {done} of {total} done {done === total && total > 0 ? '🎉' : ''}
          </div>
        </div>
        <div className="text-3xl font-bold text-brand-500">{pct}%</div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="h-full rounded-full bg-gradient-to-r from-brand-400 via-pink-400 to-purple-500"
        />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-gray-100">
      <div className="animate-float text-6xl">🌱</div>
      <h3 className="mt-3 text-xl font-bold text-gray-700">No habits yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Tap the <span className="font-semibold">Habits</span> tab to add your first one!
      </p>
    </div>
  )
}
