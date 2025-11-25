'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Zap, Cookie, Gamepad2, Moon, MessageCircle, Star, Trophy, Loader2 } from 'lucide-react'

interface Pet {
  id: string
  name: string
  type: 'cat' | 'dog' | 'rabbit' | 'dragon'
  level: number
  experience: number
  hunger: number
  happiness: number
  health: number
  energy: number
  personality: string
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'sleepy'
  coins: number
  createdAt: Date
  updatedAt: Date
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'pet'
  timestamp: Date
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: string
  reward: number
}

const PET_TYPES = {
  cat: { emoji: '🐱', name: 'Cat', personality: 'Independent, curious, playful' },
  dog: { emoji: '🐶', name: 'Dog', personality: 'Loyal, energetic, friendly' },
  rabbit: { emoji: '🐰', name: 'Rabbit', personality: 'Gentle, quiet, adorable' },
  dragon: { emoji: '🐉', name: 'Dragon', personality: 'Mysterious, powerful, wise' }
}

const EVOLUTION_STAGES = {
  1: { name: 'Baby', modifier: 1 },
  5: { name: 'Young', modifier: 1.2 },
  10: { name: 'Adult', modifier: 1.5 },
  20: { name: 'Elder', modifier: 2 }
}

const MOOD_EMOJIS = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  excited: '🤩',
  sleepy: '😴'
}

export default function VirtualPetGame() {
  const [gameState, setGameState] = useState<'selection' | 'playing' | 'loading'>('loading')
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize achievements on mount
  useEffect(() => {
    initializeAchievements()
    loadExistingPets()
  }, [])

  const initializeAchievements = async () => {
    try {
      await fetch('/api/achievements', { method: 'POST' })
    } catch (error) {
      console.error('Failed to initialize achievements:', error)
    }
  }

  const loadExistingPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const pets = await response.json()
        if (pets.length > 0) {
          setSelectedPet(pets[0])
          setGameState('playing')
          loadPetAchievements(pets[0].id)
        } else {
          setGameState('selection')
        }
      } else {
        setGameState('selection')
      }
    } catch (error) {
      console.error('Failed to load pets:', error)
      setGameState('selection')
    }
  }

  const loadPetAchievements = async (petId: string) => {
    try {
      const response = await fetch(`/api/achievements?petId=${petId}`)
      if (response.ok) {
        const petAchievements = await response.json()
        setUnlockedAchievements(petAchievements.map((pa: any) => pa.achievementId))
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }

  const createNewPet = async (type: keyof typeof PET_TYPES, name: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Sending pet creation request:', { name, type })
      
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type
        })
      })

      console.log('Pet creation response status:', response.status)
      
      if (response.ok) {
        const newPet = await response.json()
        console.log('Pet created successfully:', newPet)
        setSelectedPet(newPet)
        setGameState('playing')
        addPetMessage(`Hi! I'm ${name} the ${PET_TYPES[type].name}. ${PET_TYPES[type].personality}!`)
        
        // Check for first pet achievement
        if (type === 'dragon') {
          await unlockAchievement('adopt_dragon')
        }
        await unlockAchievement('first_friend')
      } else {
        const errorData = await response.json()
        console.error('Pet creation failed:', errorData)
        setError(errorData.error || 'Failed to create pet. Please try again.')
      }
    } catch (error) {
      console.error('Pet creation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectPet = (type: keyof typeof PET_TYPES) => {
    const name = prompt(`Name your ${PET_TYPES[type].name}:`)
    if (name && name.trim()) {
      console.log('Creating pet:', { type, name })
      createNewPet(type, name.trim())
    } else {
      console.log('No name provided or empty name')
    }
  }

  const addPetMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'pet',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const updatePetInDatabase = async (petData: Partial<Pet>) => {
    if (!selectedPet) return

    try {
      const response = await fetch(`/api/pets/${selectedPet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      })

      if (response.ok) {
        const updatedPet = await response.json()
        setSelectedPet(updatedPet)
        return updatedPet
      }
    } catch (error) {
      console.error('Failed to update pet:', error)
    }
    return null
  }

  const unlockAchievement = async (achievementId: string) => {
    if (!selectedPet || unlockedAchievements.includes(achievementId)) return

    try {
      const response = await fetch('/api/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: selectedPet.id,
          achievementId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUnlockedAchievements(prev => [...prev, achievementId])
        
        // Update pet coins if reward was given
        if (data.reward) {
          await updatePetInDatabase({
            coins: selectedPet.coins + data.reward
          })
        }
      }
    } catch (error) {
      console.error('Failed to unlock achievement:', error)
    }
  }

  const checkAchievements = async (pet: Pet) => {
    if (pet.level >= 5 && !unlockedAchievements.includes('reach_level_5')) {
      await unlockAchievement('reach_level_5')
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPet || isTyping) return

    addUserMessage(inputMessage)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          petName: selectedPet.name,
          petType: selectedPet.type,
          personality: selectedPet.personality,
          mood: selectedPet.mood,
          stats: {
            hunger: selectedPet.hunger,
            happiness: selectedPet.happiness,
            health: selectedPet.health,
            energy: selectedPet.energy
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.response) {
          addPetMessage(data.response)
          
          // Update pet mood based on conversation
          if (data.mood && data.mood !== selectedPet.mood) {
            const updatedPet = await updatePetInDatabase({ mood: data.mood })
            if (updatedPet) {
              setSelectedPet(updatedPet)
            }
          }
        }
      } else {
        addPetMessage("Sorry, I'm having trouble thinking right now. Can we talk later?")
      }
    } catch (error) {
      addPetMessage("Network error. Please try again later.")
    } finally {
      setIsTyping(false)
      setInputMessage('')
    }
  }

  const performAction = async (action: 'feed' | 'play' | 'exercise' | 'rest') => {
    if (!selectedPet || isLoading) return

    setIsLoading(true)
    let newHunger = selectedPet.hunger
    let newHappiness = selectedPet.happiness
    let newHealth = selectedPet.health
    let newEnergy = selectedPet.energy
    let newMood = selectedPet.mood
    let expGain = 5
    let coinsGain = 2

    switch (action) {
      case 'feed':
        newHunger = Math.min(100, newHunger + 20)
        newHappiness = Math.min(100, newHappiness + 5)
        newMood = 'happy'
        addPetMessage("Yummy! Thank you for the food! 🍖")
        break
      case 'play':
        newHappiness = Math.min(100, newHappiness + 15)
        newEnergy = Math.max(0, newEnergy - 10)
        newHunger = Math.max(0, newHunger - 5)
        newMood = 'excited'
        expGain = 10
        addPetMessage("That was so much fun! Let's play again! 🎾")
        break
      case 'exercise':
        newHealth = Math.min(100, newHealth + 10)
        newEnergy = Math.max(0, newEnergy - 15)
        newHunger = Math.max(0, newHunger - 10)
        newMood = 'neutral'
        expGain = 8
        addPetMessage("Great workout! I feel stronger now! 💪")
        break
      case 'rest':
        newEnergy = Math.min(100, newEnergy + 25)
        newHealth = Math.min(100, newHealth + 5)
        newMood = 'sleepy'
        addPetMessage("Zzz... that was a good nap! 😴")
        break
    }

    const evolutionStage = EVOLUTION_STAGES[
      Object.keys(EVOLUTION_STAGES)
        .map(Number)
        .sort((a, b) => b - a)
        .find(stage => selectedPet.level >= stage) || 1
    ] as keyof typeof EVOLUTION_STAGES

    const modifiedExpGain = Math.floor(expGain * evolutionStage.modifier)
    const newExperience = selectedPet.experience + modifiedExpGain
    const newLevel = Math.floor(newExperience / 100) + 1
    const newCoins = selectedPet.coins + coinsGain

    const updatedPet = await updatePetInDatabase({
      hunger: newHunger,
      happiness: newHappiness,
      health: newHealth,
      energy: newEnergy,
      mood: newMood,
      experience: newExperience,
      level: newLevel,
      coins: newCoins
    })

    if (updatedPet) {
      setSelectedPet(updatedPet)

      // Check for level up notifications
      if (newLevel > selectedPet.level) {
        const newEvolutionStage = EVOLUTION_STAGES[
          Object.keys(EVOLUTION_STAGES)
            .map(Number)
            .sort((a, b) => b - a)
            .find(stage => newLevel >= stage) || 1
        ] as keyof typeof EVOLUTION_STAGES
        addPetMessage(`🎉 Level up! I'm now a ${newEvolutionStage.name} ${selectedPet.type}!`)
      }

      // Check achievements
      setTimeout(() => checkAchievements(updatedPet), 100)
    }

    setIsLoading(false)
  }

  // Pet stats decay over time
  useEffect(() => {
    if (!selectedPet) return

    const interval = setInterval(async () => {
      const newHunger = Math.max(0, selectedPet.hunger - 2)
      const newHappiness = Math.max(0, selectedPet.happiness - 1)
      const newHealth = Math.max(0, selectedPet.health - 1)
      const newEnergy = Math.max(0, selectedPet.energy - 1)

      // Update mood based on stats
      let newMood = selectedPet.mood
      if (newHunger < 30 || newHappiness < 30) {
        newMood = 'sad'
      } else if (newEnergy < 20) {
        newMood = 'sleepy'
      } else if (newHappiness > 80) {
        newMood = 'happy'
      }

      await updatePetInDatabase({
        hunger: newHunger,
        happiness: newHappiness,
        health: newHealth,
        energy: newEnergy,
        mood: newMood
      })
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [selectedPet])

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your virtual pet...</p>
        </div>
      </div>
    )
  }

  if (gameState === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Virtual Pet Game</h1>
            <p className="text-gray-600">Choose your perfect companion!</p>
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(PET_TYPES).map(([key, pet]) => (
              <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="text-6xl mb-2">{pet.emoji}</div>
                  <CardTitle>{pet.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{pet.personality}</p>
                  <Button 
                    onClick={() => selectPet(key as keyof typeof PET_TYPES)}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Choose {pet.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getEvolutionStage = (level: number) => {
    const stages = Object.keys(EVOLUTION_STAGES).map(Number).sort((a, b) => b - a)
    const currentStage = stages.find(stage => level >= stage) || 1
    return EVOLUTION_STAGES[currentStage as keyof typeof EVOLUTION_STAGES]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{selectedPet && PET_TYPES[selectedPet.type].emoji}</div>
              <div>
                <h1 className="text-2xl font-bold">{selectedPet?.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Level {selectedPet?.level}</Badge>
                  <span className="text-lg">{selectedPet && MOOD_EMOJIS[selectedPet.mood]}</span>
                  {selectedPet && (
                    <Badge variant="outline" className="text-xs">
                      {getEvolutionStage(selectedPet.level).name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{selectedPet?.coins || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">{unlockedAchievements.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cookie className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Hunger</span>
              </div>
              <Progress value={selectedPet?.hunger} className="h-2" />
              <span className="text-xs text-gray-500">{selectedPet?.hunger}%</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Happiness</span>
              </div>
              <Progress value={selectedPet?.happiness} className="h-2" />
              <span className="text-xs text-gray-500">{selectedPet?.happiness}%</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Health</span>
              </div>
              <Progress value={selectedPet?.health} className="h-2" />
              <span className="text-xs text-gray-500">{selectedPet?.health}%</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Energy</span>
              </div>
              <Progress value={selectedPet?.energy} className="h-2" />
              <span className="text-xs text-gray-500">{selectedPet?.energy}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              onClick={() => performAction('feed')} 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cookie className="w-4 h-4" />}
              Feed
            </Button>
            <Button 
              onClick={() => performAction('play')} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Gamepad2 className="w-4 h-4" />
              Play
            </Button>
            <Button 
              onClick={() => performAction('exercise')} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Zap className="w-4 h-4" />
              Exercise
            </Button>
            <Button 
              onClick={() => performAction('rest')} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Moon className="w-4 h-4" />
              Rest
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="info">Pet Info</TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Achievements
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-4">
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-left">
                    <div className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Talk to your pet..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button onClick={handleSendMessage} disabled={isTyping || !inputMessage.trim()}>
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personality</h3>
                  <p className="text-gray-600">{selectedPet?.personality}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Evolution Stage</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedPet && getEvolutionStage(selectedPet.level).name}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      (Level {selectedPet?.level})
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <Progress value={(selectedPet?.experience || 0) % 100} className="h-2" />
                  <p className="text-sm text-gray-500">
                    {selectedPet?.experience || 0} / 100 XP to next level
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Care Tips</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Feed your pet when hunger is below 30%</li>
                    <li>• Play to increase happiness and gain XP</li>
                    <li>• Exercise improves health</li>
                    <li>• Rest when energy is low</li>
                    <li>• Higher evolution stages give bonus XP!</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Unlocked Achievements</h3>
                  {unlockedAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unlockedAchievements.map((achievementId, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-2xl">🏆</span>
                          <div>
                            <p className="font-medium text-green-800">Achievement Unlocked!</p>
                            <p className="text-sm text-green-600">Keep up the great work!</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No achievements yet. Keep playing with your pet!</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Achievement Progress</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">🌟 First Friend</span>
                      <Badge variant={unlockedAchievements.includes('first_friend') ? 'default' : 'secondary'}>
                        {unlockedAchievements.includes('first_friend') ? 'Unlocked' : 'In Progress'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">🍖 Well Fed</span>
                      <Badge variant="secondary">Feed 10 times</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">🎾 Playtime Master</span>
                      <Badge variant="secondary">Play 25 times</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">⬆️ Level Up!</span>
                      <Badge variant={selectedPet && selectedPet.level >= 5 ? 'default' : 'secondary'}>
                        {selectedPet && selectedPet.level >= 5 ? 'Unlocked' : 'Reach Level 5'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">🐉 Dragon Tamer</span>
                      <Badge variant={selectedPet && selectedPet.type === 'dragon' ? 'default' : 'secondary'}>
                        {selectedPet && selectedPet.type === 'dragon' ? 'Unlocked' : 'Adopt a Dragon'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}