import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_ACHIEVEMENTS = [
  {
    name: "First Friend",
    description: "Create your first pet",
    icon: "🌟",
    requirement: "create_first_pet",
    reward: 50
  },
  {
    name: "Well Fed",
    description: "Feed your pet 10 times",
    icon: "🍖",
    requirement: "feed_10_times",
    reward: 25
  },
  {
    name: "Playtime Master",
    description: "Play with your pet 25 times",
    icon: "🎾",
    requirement: "play_25_times",
    reward: 40
  },
  {
    name: "Level Up!",
    description: "Reach level 5 with any pet",
    icon: "⬆️",
    requirement: "reach_level_5",
    reward: 100
  },
  {
    name: "Happy Pet",
    description: "Keep happiness above 90% for an hour",
    icon: "😊",
    requirement: "high_happiness",
    reward: 30
  },
  {
    name: "Chat Champion",
    description: "Have 50 conversations with your pet",
    icon: "💬",
    requirement: "chat_50_times",
    reward: 35
  },
  {
    name: "Dragon Tamer",
    description: "Adopt a dragon pet",
    icon: "🐉",
    requirement: "adopt_dragon",
    reward: 75
  },
  {
    name: "Pet Collector",
    description: "Have 4 different pets",
    icon: "🏆",
    requirement: "collect_all_types",
    reward: 200
  }
]

export async function POST(request: NextRequest) {
  try {
    // Initialize default achievements if they don't exist
    const existingAchievements = await db.achievement.count()
    
    if (existingAchievements === 0) {
      await db.achievement.createMany({
        data: DEFAULT_ACHIEVEMENTS
      })
    }

    return NextResponse.json({ message: 'Achievements initialized' })
  } catch (error) {
    console.error('Error initializing achievements:', error)
    return NextResponse.json(
      { error: 'Failed to initialize achievements' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')

    if (petId) {
      // Get achievements for a specific pet
      const petAchievements = await db.petAchievement.findMany({
        where: { petId },
        include: {
          achievement: true
        }
      })

      return NextResponse.json(petAchievements)
    } else {
      // Get all available achievements
      const achievements = await db.achievement.findMany({
        orderBy: { reward: 'desc' }
      })

      return NextResponse.json(achievements)
    }
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}