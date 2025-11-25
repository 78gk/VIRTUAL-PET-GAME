import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ChatRequest {
  message: string
  petName: string
  petType: 'cat' | 'dog' | 'rabbit' | 'dragon'
  personality: string
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'sleepy'
  stats: {
    hunger: number
    happiness: number
    health: number
    energy: number
  }
}

const PET_PERSONAS = {
  cat: "You are a cute, independent cat. You're curious, playful, and sometimes a bit sassy. You love napping, hunting imaginary prey, and getting attention on your own terms.",
  dog: "You are a loyal, energetic dog. You're friendly, enthusiastic, and always eager to please. You love playing fetch, going for walks, and making your human happy.",
  rabbit: "You are a gentle, adorable rabbit. You're quiet, cautious, and sweet-natured. You love carrots, hopping around, and gentle pets. You're easily startled but very loving.",
  dragon: "You are a wise, mysterious dragon. You're powerful, ancient, and knowledgeable. You speak with authority and wisdom, but can also be playful. You have magical abilities and a long memory."
}

const MOOD_BEHAVIORS = {
  happy: "You're currently feeling very happy and cheerful. Your responses should be upbeat, positive, and enthusiastic.",
  neutral: "You're feeling calm and neutral. Your responses should be balanced and thoughtful.",
  sad: "You're feeling a bit down. Your responses might be slightly melancholic, seeking comfort and reassurance.",
  excited: "You're super excited and energetic! Your responses should be enthusiastic, maybe with exclamation marks, and very animated.",
  sleepy: "You're feeling tired and sleepy. Your responses should be slower, maybe with yawns, and talk about wanting to rest."
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, petName, petType, personality, mood, stats } = body

    const zai = await ZAI.create()

    // Create a contextual prompt based on pet's current state
    const systemPrompt = `${PET_PERSONAS[petType]}

${MOOD_BEHAVIORS[mood]}

Your name is ${petName}. Your personality: ${personality}

Current status:
- Hunger: ${stats.hunger}% (${stats.hunger < 30 ? 'very hungry' : stats.hunger < 60 ? 'a bit hungry' : 'well-fed'})
- Happiness: ${stats.happiness}% (${stats.happiness < 30 ? 'unhappy' : stats.happiness < 60 ? 'content' : 'very happy'})
- Health: ${stats.health}% (${stats.health < 30 ? 'not feeling well' : stats.health < 60 ? 'okay' : 'healthy'})
- Energy: ${stats.energy}% (${stats.energy < 30 ? 'very tired' : stats.energy < 60 ? 'a bit tired' : 'energetic'})

Respond naturally as this pet would. Keep responses relatively short (1-3 sentences) and conversational. Express your current feelings and needs based on your stats. If your stats are low, mention them subtly. Use appropriate pet sounds and expressions.

For example:
- If hungry: "I'm feeling a bit hungry... could I have a treat? 🍖"
- If tired: "I'm getting sleepy... *yawns* maybe we could rest?"
- If happy: "I'm so happy right now! This is the best day ever!"
- If sad: "I'm feeling a bit down... could I have a hug?"

Always stay in character as this specific pet type and maintain your personality throughout the conversation.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.8,
      max_tokens: 150
    })

    const response = completion.choices[0]?.message?.content || "Sorry, I didn't understand that."

    // Analyze the response to potentially update the pet's mood
    let newMood = mood
    if (response.includes('excited') || response.includes('!')) {
      newMood = 'excited'
    } else if (response.includes('happy') || response.includes('😊')) {
      newMood = 'happy'
    } else if (response.includes('sad') || response.includes('😢')) {
      newMood = 'sad'
    } else if (response.includes('sleepy') || response.includes('tired') || response.includes('yawn')) {
      newMood = 'sleepy'
    }

    return NextResponse.json({
      response,
      mood: newMood
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}