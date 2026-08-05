import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { GameState } from '../types/game'

export function useGameState(roomCode: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    if (!roomCode) return

    // Initial fetch
    supabase.from('game_state').select('*').eq('room_code', roomCode).single()
      .then(({ data }) => {
        if (data) setGameState(data as GameState)
      })

    // Subscribe to changes
    const sub = supabase
      .channel(`gamestate-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setGameState(payload.new as GameState)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [roomCode])

  return { gameState, setGameState }
}
