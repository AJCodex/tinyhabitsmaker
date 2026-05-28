// Pick a motivational message based on current state.
export function pickMotivation({ doneToday, totalToday, bestStreak, todayStreakSum, totalStars }) {
  if (totalToday === 0) {
    return { emoji: '🌱', text: 'Add a habit to start your adventure!' }
  }
  if (doneToday === totalToday) {
    return { emoji: '🎉', text: "All done today! You're a superstar!" }
  }
  if (todayStreakSum >= 7) {
    return { emoji: '🔥', text: "A whole week strong — keep the fire going!" }
  }
  if (bestStreak >= 14) {
    return { emoji: '🏆', text: `Your best streak is ${bestStreak} days. Legendary!` }
  }
  if (totalStars >= 50) {
    return { emoji: '✨', text: `${totalStars} stars and counting!` }
  }
  if (doneToday > 0) {
    return { emoji: '💪', text: `${doneToday} down, ${totalToday - doneToday} to go. You got this!` }
  }
  return { emoji: '☀️', text: 'A fresh new day — pick your first habit!' }
}

// Confetti milestones
export const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100])
