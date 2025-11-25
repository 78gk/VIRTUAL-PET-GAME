import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type } = body

    // Ensure a default user exists
    const defaultUser = await db.user.upsert({
      where: { email: 'default-user@example.com' },
      update: {},
      create: {
        email: 'default-user@example.com',
        name: 'Default User'
      }
    })

    const petTypes = {
      cat: 'Independent, curious, playful',
      dog: 'Loyal, energetic, friendly', 
      rabbit: 'Gentle, quiet, adorable',
      dragon: 'Mysterious, powerful, wise'
    }

    const pet = await db.pet.create({
      data: {
        name,
        type,
        personality: petTypes[type as keyof typeof petTypes] || 'Friendly and playful',
        ownerId: defaultUser.id
      }
    })

    return NextResponse.json(pet)
  } catch (error) {
    console.error('Error creating pet:', error)
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    // If no ownerId provided, use default user
    let targetUserId = ownerId
    if (!targetUserId) {
      const defaultUser = await db.user.upsert({
        where: { email: 'default-user@example.com' },
        update: {},
        create: {
          email: 'default-user@example.com',
          name: 'Default User'
        }
      })
      targetUserId = defaultUser.id
    }

    const pets = await db.pet.findMany({
      where: { ownerId: targetUserId },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    })

    return NextResponse.json(pets)
  } catch (error) {
    console.error('Error fetching pets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    )
  }
}