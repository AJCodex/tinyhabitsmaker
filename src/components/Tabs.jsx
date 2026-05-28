import { motion } from 'framer-motion'

const DEFAULT_TABS = [
  { id: 'today', label: 'Today', emoji: '🏠' },
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'habits', label: 'Habits', emoji: '⚙️' },
]

export default function Tabs({ active, onChange, tabs = DEFAULT_TABS }) {
  return (
    <nav className="sticky top-2 z-20 mx-auto mt-4 flex w-fit gap-1 rounded-full bg-white/80 p-1.5 shadow-soft backdrop-blur">
      {tabs.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 sm:text-base"
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400 to-purple-500"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-white' : 'text-gray-600'}`}>
              <span className="mr-1">{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
