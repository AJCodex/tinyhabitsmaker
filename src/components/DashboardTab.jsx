import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { isoDate, currentStreak, longestStreak, lastNDays, heatmapWeeks } from '../utils/dates'
import { pickMotivation } from '../utils/motivation'

export default function DashboardTab({ habits, compsByHabit, compsByDate, totalStars }) {
  const today = isoDate()
  const total = habits.length
  const done = habits.filter((h) => compsByHabit[h.id]?.has(today)).length

  const stats = useMemo(() => {
    let best = 0
    let todayStreakSum = 0
    for (const h of habits) {
      const set = compsByHabit[h.id] || new Set()
      const cur = currentStreak(set)
      todayStreakSum += cur
      const lng = longestStreak(set)
      if (lng > best) best = lng
    }
    return { best, todayStreakSum }
  }, [habits, compsByHabit])

  const motivation = pickMotivation({
    doneToday: done,
    totalToday: total,
    bestStreak: stats.best,
    todayStreakSum: stats.todayStreakSum,
    totalStars,
  })

  const week = useMemo(() => lastNDays(7, compsByDate), [compsByDate])
  const heat = useMemo(() => heatmapWeeks(13, compsByDate), [compsByDate])

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

      <Heatmap heat={heat} />
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

function Heatmap({ heat }) {
  const shade = (count) => {
    if (!count) return 'bg-gray-100'
    if (count === 1) return 'bg-brand-200'
    if (count === 2) return 'bg-brand-300'
    if (count === 3) return 'bg-brand-400'
    return 'bg-brand-600'
  }
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-gray-100">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
        Last 13 weeks
      </h3>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {heat.weeks.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((d, di) => (
              <motion.div
                key={d.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: d.isFuture ? 0.2 : 1 }}
                transition={{ delay: (wi * 7 + di) * 0.005 }}
                title={`${d.date}: ${d.count} done`}
                className={`h-4 w-4 rounded ${d.isFuture ? 'bg-gray-50' : shade(d.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-gray-400">
        <span>less</span>
        <span className="h-3 w-3 rounded bg-gray-100" />
        <span className="h-3 w-3 rounded bg-brand-200" />
        <span className="h-3 w-3 rounded bg-brand-300" />
        <span className="h-3 w-3 rounded bg-brand-400" />
        <span className="h-3 w-3 rounded bg-brand-600" />
        <span>more</span>
      </div>
    </div>
  )
}
