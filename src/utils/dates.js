// Returns YYYY-MM-DD for a Date (local time)
export function isoDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d, n) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

// Compute current streak (consecutive days up to today) for a habit
// given a Set of completion date strings (YYYY-MM-DD).
export function currentStreak(completionSet) {
  let streak = 0
  let cursor = new Date()
  // If today not done yet, start counting from yesterday so streak doesn't break mid-day
  if (!completionSet.has(isoDate(cursor))) {
    cursor = addDays(cursor, -1)
  }
  while (completionSet.has(isoDate(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// Build last N days [{date, label, count}]
export function lastNDays(n, completionsByDate) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(new Date(), -i)
    const key = isoDate(d)
    out.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      count: completionsByDate[key] || 0,
    })
  }
  return out
}

// Longest streak ever across a Set of completion dates (YYYY-MM-DD).
export function longestStreak(completionSet) {
  if (completionSet.size === 0) return 0
  const sorted = [...completionSet].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const cur = new Date(sorted[i])
    const diff = Math.round((cur - prev) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      run += 1
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }
  return longest
}

// Build a heatmap grid of the last `weeks` weeks (each week = 7 days, Sun..Sat).
// Returns { weeks: [[{date,count}, x7], ...], max }
export function heatmapWeeks(weeks, completionsByDate) {
  const today = new Date()
  // Find the most recent Saturday (end of current week column).
  const endOfWeek = addDays(today, 6 - today.getDay())
  const totalDays = weeks * 7
  const start = addDays(endOfWeek, -(totalDays - 1))
  const all = []
  let max = 0
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i)
    const key = isoDate(d)
    const count = completionsByDate[key] || 0
    if (count > max) max = count
    all.push({ date: key, count, isFuture: d > today })
  }
  const cols = []
  for (let w = 0; w < weeks; w++) {
    cols.push(all.slice(w * 7, w * 7 + 7))
  }
  return { weeks: cols, max }
}
