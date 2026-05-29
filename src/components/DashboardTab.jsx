import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  isoDate,
  yesterdayIso,
  isEditableDate,
  currentStreak,
  longestStreak,
  lastNDays,
  heatmapWeeks,
} from '../utils/dates'
import { pickMotivation } from '../utils/motivation'

export default function DashboardTab({
  habits,
  compsByHabit,
  onTimeByHabit,
  compsByDate,
  backfilledKeys,
  totalStars,
  onToggleDay,
}) {
  const today = isoDate()
  const total = habits.length
  const done = habits.filter((h) => compsByHabit[h.id]?.has(today)).length

  const [editingDate, setEditingDate] = useState(null)

  const stats = useMemo(() => {
    let best = 0
    let todayStreakSum = 0
    const src = onTimeByHabit || compsByHabit
    for (const h of habits) {
      const set = src[h.id] || new Set()
      const cur = currentStreak(set)
      todayStreakSum += cur
      const lng = longestStreak(set)
      if (lng > best) best = lng
    }
    return { best, todayStreakSum }
  }, [habits, compsByHabit, onTimeByHabit])

  const motivation = pickMotivation({
    doneToday: done,
    totalToday: total,
    bestStreak: stats.best,
    todayStreakSum: stats.todayStreakSum,
    totalStars,
  })

  const week = useMemo(() => lastNDays(7, compsByDate), [compsByDate])
  const heat = useMemo(() => heatmapWeeks(10, compsByDate), [compsByDate])

  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="space-y-5">
      <HeroCard pct={pct} done={done} total={total} bestStreak={stats.best} totalStars={totalStars} />

      <MotivationCard motivation={motivation} />

      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
          Last 7 days
        </h3>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={week} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                cursor={{ fill: '#fce7f3' }}
                contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Fredoka' }}
              />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Heatmap
        heat={heat}
        backfilledKeys={backfilledKeys}
        onPickDate={(d) => isEditableDate(d) && setEditingDate(d)}
      />

      <AnimatePresence>
        {editingDate && (
          <BackfillSheet
            dateIso={editingDate}
            habits={habits}
            compsByHabit={compsByHabit}
            backfilledKeys={backfilledKeys}
            onToggleDay={onToggleDay}
            onClose={() => setEditingDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function HeroCard({ pct, done, total, bestStreak, totalStars }) {
  // Ring math
  const size = 120
  const stroke = 12
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-500 via-pink-500 to-purple-600 p-6 text-white shadow-pop">
      <div className="flex items-center gap-5">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="white"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold leading-none">{pct}%</div>
            <div className="text-xs opacity-90">today</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <StatRow emoji="✅" label="Done today" value={`${done} / ${total}`} />
          <StatRow emoji="🏆" label="Best streak" value={`${bestStreak} day${bestStreak === 1 ? '' : 's'}`} />
          <StatRow emoji="⭐" label="Total stars" value={totalStars} />
        </div>
      </div>
    </div>
  )
}

function StatRow({ emoji, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur">
      <span className="text-sm font-medium opacity-95">
        <span className="mr-1">{emoji}</span>
        {label}
      </span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}

function MotivationCard({ motivation }) {
  return (
    <motion.div
      key={motivation.text}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100"
    >
      <div className="animate-float text-4xl">{motivation.emoji}</div>
      <div className="font-semibold text-gray-700">{motivation.text}</div>
    </motion.div>
  )
}

function Heatmap({ heat, backfilledKeys, onPickDate }) {
  const yIso = yesterdayIso()
  const tIso = isoDate()

  const shade = (count) => {
    if (!count) return 'bg-gray-100'
    if (count === 1) return 'bg-brand-200'
    if (count === 2) return 'bg-brand-300'
    if (count === 3) return 'bg-brand-400'
    return 'bg-brand-600'
  }

  const isBackfilledDate = (date) => {
    if (!backfilledKeys || backfilledKeys.size === 0) return false
    for (const k of backfilledKeys) {
      if (k.endsWith(`|${date}`)) return true
    }
    return false
  }

  // Day-of-month for a YYYY-MM-DD string (no timezone surprises).
  const dayOfMonth = (iso) => Number(iso.split('-')[2])

  // Day-of-week labels (Sun..Sat) shown as a top header row.
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // 7-column grid: each row is one week, Sun..Sat left→right, oldest week on top.
  const rowStyle = { gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
          Last 10 weeks
        </h3>
        <p className="text-[10px] text-gray-400">tap yesterday to log missed</p>
      </div>

      <div className="min-w-0">
        {/* Day-of-week header */}
        <div
          className="mb-1 grid gap-1 text-center text-[10px] font-medium text-gray-400"
          style={rowStyle}
        >
          {dayLabels.map((label) => (
            <div key={label} className="leading-none">
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap rows: one row per week, oldest on top → newest at bottom */}
        <div className="space-y-1">
          {heat.weeks.map((week, wi) => (
            <div key={wi} className="grid gap-1" style={rowStyle}>
              {week.map((d, di) => {
                const editable = (d.date === tIso || d.date === yIso) && !d.isFuture
                const backfilled = isBackfilledDate(d.date)
                const filled = d.count > 0
                const dayNum = dayOfMonth(d.date)
                return (
                  <motion.button
                    type="button"
                    key={d.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: d.isFuture ? 0.2 : 1 }}
                    transition={{ delay: (wi * 7 + di) * 0.005 }}
                    title={`${d.date}: ${d.count} done${backfilled ? ' (some logged later)' : ''}${editable ? ' · tap to edit' : ''}`}
                    onClick={() => editable && onPickDate(d.date)}
                    disabled={!editable}
                    className={`relative flex h-5 w-full items-center justify-center rounded text-[9px] font-semibold leading-none ${d.isFuture ? 'bg-gray-50' : shade(d.count)} ${filled ? 'text-white/70' : 'text-gray-400/70'} ${editable ? 'ring-2 ring-purple-300 ring-offset-1 cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="select-none">{dayNum}</span>
                    {backfilled && !d.isFuture && (
                      <span className="absolute right-0 top-0 block h-1.5 w-1.5 -translate-y-0.5 translate-x-0.5 rounded-full bg-gray-500 ring-1 ring-white" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-1 text-xs text-gray-400">
        <span>less</span>
        <span className="h-3 w-3 rounded bg-gray-100" />
        <span className="h-3 w-3 rounded bg-brand-200" />
        <span className="h-3 w-3 rounded bg-brand-300" />
        <span className="h-3 w-3 rounded bg-brand-400" />
        <span className="h-3 w-3 rounded bg-brand-600" />
        <span>more</span>
        <span className="ml-3 inline-flex items-center gap-1">
          <span className="relative inline-block h-3 w-3 rounded bg-brand-300">
            <span className="absolute right-0 top-0 block h-1.5 w-1.5 -translate-y-0.5 translate-x-0.5 rounded-full bg-gray-500 ring-1 ring-white" />
          </span>
          logged later
        </span>
      </div>
    </div>
  )
}

function BackfillSheet({ dateIso, habits, compsByHabit, backfilledKeys, onToggleDay, onClose }) {
  const isToday = dateIso === isoDate()
  const label = isToday ? 'Today' : 'Yesterday'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-pop sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Log for {label}
            </div>
            <div className="text-lg font-bold text-gray-800">{dateIso}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {!isToday && (
          <p className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            💛 Backfills count for history but <strong>don't extend your streak</strong>.
            Streaks only grow when you check off habits on the same day.
          </p>
        )}

        <div className="space-y-2">
          {habits.length === 0 && (
            <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
              No habits yet.
            </div>
          )}
          {habits.map((h) => {
            const done = compsByHabit[h.id]?.has(dateIso)
            const wasBackfill = backfilledKeys?.has(`${h.id}|${dateIso}`)
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onToggleDay(h, dateIso)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                  done
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-brand-200'
                }`}
              >
                <span className="text-2xl">{h.emoji}</span>
                <span className="flex-1 font-semibold text-gray-800">{h.name}</span>
                {done && wasBackfill && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    logged later
                  </span>
                )}
                <span className="text-xl">{done ? '✅' : '⭕'}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-brand-500 py-3 font-bold text-white shadow-pop hover:bg-brand-600"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  )
}
