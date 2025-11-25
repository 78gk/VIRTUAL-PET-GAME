import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { stats, mood, experience, level, coins, hunger, happiness, health, energy } = body

    // Handle both flat properties and nested stats object
    const updateData: any = {
      ...(mood && { mood }),
      ...(experience !== undefined && { experience }),
      ...(level !== undefined && { level }),
      ...(coins !== undefined && { coins })
    }

    // If stats object is provided, use it
    if (stats) {
      updateData.hunger = stats.hunger
      updateData.happiness = stats.happiness
      updateData.health = stats.health
      updateData.energy = stats.energy
    } 
    // Otherwise, use flat properties
    else {
      if (hunger !== undefined) updateData.hunger = hunger
      if (happiness !== undefined) updateData.happiness = happiness
      if (health !== undefined) updateData.health = health
      if (energy !== undefined) updateData.energy = energy
    }

    const pet = await db.pet.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(pet)
  } catch (error) {
    console.error('Error updating pet:', error)
    return NextResponse.json(
      { error: 'Failed to update pet' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pet = await db.pet.findUnique({
      where: { id: params.id },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    })

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pet)
  } catch (error) {
    console.error('Error fetching pet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pet' },
      { status: 500 }
    )
  }
}