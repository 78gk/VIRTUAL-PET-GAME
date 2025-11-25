import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, achievementId } = body

    // Check if achievement is already unlocked
    const existing = await db.petAchievement.findUnique({
      where: {
        petId_achievementId: {
          petId,
          achievementId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Achievement already unlocked' })
    }

    // Get achievement details
    const achievement = await db.achievement.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      )
    }

    // Unlock achievement
    const petAchievement = await db.petAchievement.create({
      data: {
        petId,
        achievementId
      },
      include: {
        achievement: true
      }
    })

    // Award coins to pet
    await db.pet.update({
      where: { id: petId },
      data: {
        coins: {
          increment: achievement.reward
        }
      }
    })

    return NextResponse.json({
      petAchievement,
      reward: achievement.reward
    })
  } catch (error) {
    console.error('Error unlocking achievement:', error)
    return NextResponse.json(
      { error: 'Failed to unlock achievement' },
      { status: 500 }
    )
  }
}