import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isoDate,
  addDays,
  yesterdayIso,
  isEditableDate,
  currentStreak,
  longestStreak,
  lastNDays,
  heatmapWeeks,
} from '../utils/dates'

// Freeze "today" so date math is deterministic
const FAKE_NOW = new Date('2026-05-15T10:30:00') // a Friday

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FAKE_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('isoDate', () => {
  it('formats today as YYYY-MM-DD', () => {
    expect(isoDate()).toBe('2026-05-15')
  })

  it('formats an arbitrary date', () => {
    expect(isoDate(new Date('2026-01-03T23:59:59'))).toBe('2026-01-03')
  })

  it('zero-pads single-digit month and day', () => {
    expect(isoDate(new Date('2026-02-05T00:00:00'))).toBe('2026-02-05')
  })

  it('uses local time, not UTC', () => {
    // Pure local: same Y/M/D as the constructor input
    const d = new Date(2026, 11, 31) // 31 Dec 2026 local
    expect(isoDate(d)).toBe('2026-12-31')
  })
})

describe('addDays', () => {
  it('adds positive days', () => {
    expect(isoDate(addDays(new Date('2026-05-15'), 5))).toBe('2026-05-20')
  })

  it('subtracts with negative days', () => {
    expect(isoDate(addDays(new Date('2026-05-15'), -10))).toBe('2026-05-05')
  })

  it('rolls across month boundary', () => {
    expect(isoDate(addDays(new Date('2026-01-31'), 1))).toBe('2026-02-01')
  })

  it('rolls across year boundary', () => {
    expect(isoDate(addDays(new Date('2026-12-31'), 1))).toBe('2027-01-01')
  })

  it('does not mutate the input', () => {
    const d = new Date('2026-05-15')
    addDays(d, 5)
    expect(isoDate(d)).toBe('2026-05-15')
  })
})

describe('yesterdayIso', () => {
  it('returns the day before today', () => {
    expect(yesterdayIso()).toBe('2026-05-14')
  })

  it('handles month boundary', () => {
    vi.setSystemTime(new Date('2026-06-01T08:00:00'))
    expect(yesterdayIso()).toBe('2026-05-31')
  })

  it('handles year boundary', () => {
    vi.setSystemTime(new Date('2027-01-01T08:00:00'))
    expect(yesterdayIso()).toBe('2026-12-31')
  })
})

describe('isEditableDate', () => {
  it('accepts today', () => {
    expect(isEditableDate('2026-05-15')).toBe(true)
  })

  it('accepts yesterday', () => {
    expect(isEditableDate('2026-05-14')).toBe(true)
  })

  it('rejects 2 days ago', () => {
    expect(isEditableDate('2026-05-13')).toBe(false)
  })

  it('rejects tomorrow', () => {
    expect(isEditableDate('2026-05-16')).toBe(false)
  })

  it('rejects far past dates', () => {
    expect(isEditableDate('2025-01-01')).toBe(false)
  })
})

describe('currentStreak', () => {
  it('returns 0 for an empty set', () => {
    expect(currentStreak(new Set())).toBe(0)
  })

  it('counts a single completion today', () => {
    expect(currentStreak(new Set(['2026-05-15']))).toBe(1)
  })

  it('counts consecutive days ending today', () => {
    expect(
      currentStreak(new Set(['2026-05-13', '2026-05-14', '2026-05-15'])),
    ).toBe(3)
  })

  it('counts streak ending yesterday (today not yet done)', () => {
    expect(
      currentStreak(new Set(['2026-05-12', '2026-05-13', '2026-05-14'])),
    ).toBe(3)
  })

  it('returns 0 if last completion is older than yesterday', () => {
    expect(currentStreak(new Set(['2026-05-10', '2026-05-11']))).toBe(0)
  })

  it('breaks on a missed day in the middle of consecutive completions', () => {
    // 13 done, 14 missed, 15 done -> only today counts
    expect(currentStreak(new Set(['2026-05-13', '2026-05-15']))).toBe(1)
  })

  it('ignores future dates beyond today', () => {
    expect(
      currentStreak(new Set(['2026-05-15', '2026-05-20'])),
    ).toBe(1)
  })
})

describe('longestStreak', () => {
  it('returns 0 for empty', () => {
    expect(longestStreak(new Set())).toBe(0)
  })

  it('returns 1 for a single day', () => {
    expect(longestStreak(new Set(['2026-05-15']))).toBe(1)
  })

  it('finds the longest of multiple runs', () => {
    const s = new Set([
      '2026-05-01',
      '2026-05-02',
      // gap
      '2026-05-10',
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      // gap
      '2026-05-15',
    ])
    expect(longestStreak(s)).toBe(4)
  })

  it('handles unsorted input', () => {
    const s = new Set(['2026-05-03', '2026-05-01', '2026-05-02'])
    expect(longestStreak(s)).toBe(3)
  })

  it('handles all-non-consecutive dates', () => {
    expect(longestStreak(new Set(['2026-05-01', '2026-05-05', '2026-05-10']))).toBe(1)
  })
})

describe('lastNDays', () => {
  it('returns N items', () => {
    expect(lastNDays(7, {}).length).toBe(7)
  })

  it('ends with today', () => {
    const days = lastNDays(7, {})
    expect(days[days.length - 1].date).toBe('2026-05-15')
  })

  it('starts (N-1) days before today', () => {
    const days = lastNDays(7, {})
    expect(days[0].date).toBe('2026-05-09')
  })

  it('fills counts from the supplied map', () => {
    const days = lastNDays(7, { '2026-05-15': 3, '2026-05-12': 1 })
    expect(days[days.length - 1].count).toBe(3)
    expect(days.find((d) => d.date === '2026-05-12').count).toBe(1)
    expect(days.find((d) => d.date === '2026-05-11').count).toBe(0)
  })

  it('returns a human-readable label', () => {
    const days = lastNDays(1, {})
    expect(typeof days[0].label).toBe('string')
    expect(days[0].label.length).toBeGreaterThan(0)
  })
})

describe('heatmapWeeks', () => {
  it('returns the requested number of week columns of 7 days each', () => {
    const { weeks } = heatmapWeeks(4, {})
    expect(weeks.length).toBe(4)
    for (const col of weeks) expect(col.length).toBe(7)
  })

  it('marks future days within the current week as isFuture', () => {
    // FAKE_NOW is Friday 2026-05-15. Saturday 2026-05-16 is in the future.
    const { weeks } = heatmapWeeks(1, {})
    const last = weeks[weeks.length - 1]
    const sat = last.find((d) => d.date === '2026-05-16')
    expect(sat).toBeDefined()
    expect(sat.isFuture).toBe(true)
  })

  it('today is not marked as future', () => {
    const { weeks } = heatmapWeeks(1, {})
    const today = weeks.flat().find((d) => d.date === '2026-05-15')
    expect(today.isFuture).toBe(false)
  })

  it('reports the max count across the window', () => {
    const map = { '2026-05-15': 5, '2026-05-14': 2 }
    const { max } = heatmapWeeks(2, map)
    expect(max).toBe(5)
  })

  it('counts default to 0 for days with no completions', () => {
    const { weeks } = heatmapWeeks(1, {})
    expect(weeks.flat().every((d) => d.count === 0)).toBe(true)
  })
})
