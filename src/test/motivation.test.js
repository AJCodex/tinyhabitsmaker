import { describe, it, expect } from 'vitest'
import { pickMotivation, STREAK_MILESTONES } from '../utils/motivation'

describe('pickMotivation', () => {
  it('returns a "start" message when no habits exist', () => {
    const m = pickMotivation({
      doneToday: 0,
      totalToday: 0,
      bestStreak: 0,
      todayStreakSum: 0,
      totalStars: 0,
    })
    expect(m.emoji).toBeTruthy()
    expect(m.text.toLowerCase()).toMatch(/add a habit/)
  })

  it('celebrates when all habits are done today', () => {
    const m = pickMotivation({
      doneToday: 3,
      totalToday: 3,
      bestStreak: 5,
      todayStreakSum: 6,
      totalStars: 10,
    })
    expect(m.text.toLowerCase()).toMatch(/all done|superstar/)
  })

  it('prioritises "all done" over a 7-day streak', () => {
    const m = pickMotivation({
      doneToday: 2,
      totalToday: 2,
      bestStreak: 1,
      todayStreakSum: 14, // 2 habits × 7-day streaks
      totalStars: 0,
    })
    expect(m.text.toLowerCase()).toMatch(/all done/)
  })

  it('mentions a week-long streak', () => {
    const m = pickMotivation({
      doneToday: 1,
      totalToday: 3,
      bestStreak: 6,
      todayStreakSum: 8,
      totalStars: 5,
    })
    expect(m.text.toLowerCase()).toMatch(/week|fire/)
  })

  it('calls out a 14+ best streak when not on fire today', () => {
    const m = pickMotivation({
      doneToday: 0,
      totalToday: 3,
      bestStreak: 20,
      todayStreakSum: 0,
      totalStars: 5,
    })
    expect(m.text.toLowerCase()).toMatch(/legendary|best streak/)
  })

  it('calls out 50+ stars', () => {
    const m = pickMotivation({
      doneToday: 0,
      totalToday: 3,
      bestStreak: 2,
      todayStreakSum: 0,
      totalStars: 75,
    })
    expect(m.text).toMatch(/75/)
  })

  it('encourages partial progress', () => {
    const m = pickMotivation({
      doneToday: 2,
      totalToday: 5,
      bestStreak: 1,
      todayStreakSum: 1,
      totalStars: 4,
    })
    expect(m.text).toMatch(/2.*3/) // 2 down, 3 to go
  })

  it('encourages a fresh day with nothing done yet', () => {
    const m = pickMotivation({
      doneToday: 0,
      totalToday: 3,
      bestStreak: 1,
      todayStreakSum: 0,
      totalStars: 1,
    })
    expect(m.text.toLowerCase()).toMatch(/fresh|day|pick/)
  })

  it('always returns both emoji and text', () => {
    const cases = [
      { doneToday: 0, totalToday: 0, bestStreak: 0, todayStreakSum: 0, totalStars: 0 },
      { doneToday: 5, totalToday: 5, bestStreak: 30, todayStreakSum: 30, totalStars: 999 },
      { doneToday: 1, totalToday: 1, bestStreak: 0, todayStreakSum: 0, totalStars: 1 },
    ]
    for (const c of cases) {
      const m = pickMotivation(c)
      expect(typeof m.emoji).toBe('string')
      expect(m.emoji.length).toBeGreaterThan(0)
      expect(typeof m.text).toBe('string')
      expect(m.text.length).toBeGreaterThan(0)
    }
  })
})

describe('STREAK_MILESTONES', () => {
  it('contains the expected milestone days', () => {
    for (const day of [3, 7, 14, 30, 60, 100]) {
      expect(STREAK_MILESTONES.has(day)).toBe(true)
    }
  })

  it('does not fire for non-milestone days', () => {
    for (const day of [1, 2, 4, 8, 50, 99]) {
      expect(STREAK_MILESTONES.has(day)).toBe(false)
    }
  })
})
