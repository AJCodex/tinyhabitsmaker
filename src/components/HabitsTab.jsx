import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['⭐', '📚', '🦷', '🛏️', '💧', '🏃', '🎨', '🧹', '🥕', '🎹', '🧘', '🐶']
const MAX_HABITS = 5

export default function HabitsTab({ habits, onAdd, onDelete, onSeed }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [points, setPoints] = useState(1)
  const [seeding, setSeeding] = useState(false)
  const atLimit = habits.length >= MAX_HABITS

  async function submit(e) {
    e.preventDefault()
    if (atLimit) return
    const n = name.trim()
    if (!n) return
    await onAdd({ name: n, emoji, points: Number(points) || 1 })
    setName('')
    setEmoji('⭐')
    setPoints(1)
  }

  async function handleSeed() {
    if (seeding || !onSeed) return
    setSeeding(true)
    try {
      await onSeed()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Your habits</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              atLimit ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'
            }`}
          >
            {habits.length} / {MAX_HABITS}
          </span>
        </div>
        {habits.length === 0 ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-gray-400">No habits yet — add one below!</p>
            {onSeed && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={seeding}
                onClick={handleSeed}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-60"
              >
                ✨ {seeding ? 'Adding…' : 'Try sample data'}
              </motion.button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {habits.map((h) => (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    {h.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{h.name}</div>
                    <div className="text-xs text-gray-500">+{h.points || 1} ⭐ per check</div>
                  </div>
                  <button
                    onClick={() => onDelete(h)}
                    className="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={`Delete ${h.name}`}
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {atLimit ? 'You hit the 5-habit limit 🎯' : 'Add a new habit'}
        </h2>
        {atLimit ? (
          <p className="text-sm text-gray-500">
            Keep it simple! Delete one above to add a new one.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Pick an emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition ${
                      emoji === e
                        ? 'scale-110 bg-gradient-to-br from-brand-400 to-purple-500 shadow-md'
                        : 'bg-gray-100 hover:bg-brand-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Read 15 minutes"
                maxLength={40}
                className="w-full rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 text-base font-medium focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                Stars per check
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPoints(p)}
                    className={`flex-1 rounded-2xl px-3 py-2 font-bold transition ${
                      points === p
                        ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-amber-100'
                    }`}
                  >
                    {p} ⭐
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 py-3 text-lg font-bold text-white shadow-pop"
            >
              Add habit
            </motion.button>
          </form>
        )}
      </div>
    </div>
  )
}
