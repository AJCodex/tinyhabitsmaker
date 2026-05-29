import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { isoDate, addDays } from './dates'

const SAMPLES = [
  { name: 'Read 15 minutes', emoji: '📚', points: 2 },
  { name: 'Brush teeth', emoji: '🦷', points: 1 },
  { name: 'Drink water', emoji: '💧', points: 1 },
]

// Pre-baked completion pattern across the last 30 days.
// Mix of streaks + misses so charts and heatmap look interesting.
function pickPattern(habitIdx) {
  const days = []
  for (let i = 29; i >= 0; i--) {
    // Different patterns per habit so the data isn't uniform
    const seed = (i * 7 + habitIdx * 3) % 10
    let done = false
    if (habitIdx === 0) done = seed !== 3 && seed !== 7 // ~80%
    if (habitIdx === 1) done = seed % 2 === 0 // 50%
    if (habitIdx === 2) done = i < 7 ? true : seed < 6 // strong recent streak
    if (done) days.push(addDays(new Date(), -i))
  }
  return days
}

/**
 * Seed 3 sample habits + 30 days of completions for the given user.
 * Uses batched writes so it's a single atomic operation.
 */
export async function seedSampleData(userId) {
  if (!userId) throw new Error('seedSampleData: userId required')
  const batch = writeBatch(db)
  const habitsCol = collection(db, 'habits')

  SAMPLES.forEach((sample, idx) => {
    const habitRef = doc(habitsCol) // auto id
    batch.set(habitRef, {
      userId,
      name: sample.name,
      emoji: sample.emoji,
      points: sample.points,
      createdAt: serverTimestamp(),
    })
    const dates = pickPattern(idx)
    for (const d of dates) {
      const date = isoDate(d)
      const compRef = doc(db, 'completions', `${habitRef.id}_${date}`)
      batch.set(compRef, {
        userId,
        habitId: habitRef.id,
        date,
        completedAt: serverTimestamp(),
        loggedOnTime: true,
      })
    }
  })

  await batch.commit()
}
