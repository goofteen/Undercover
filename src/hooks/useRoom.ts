import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { GameState, Player, Room } from '../types/game'

/**
 * Single hook that fetches room, players, and game_state in one parallel batch
 * and subscribes to all three tables on one channel — reducing both latency
 * (3 queries fire together) and WebSocket overhead (1 channel, not 2).
 */
export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) {
      setLoading(false)
      return
    }

    // Fetch all three tables in one parallel batch
    Promise.all([
      supabase.from('rooms').select('*').eq('room_code', roomCode).single(),
      supabase.from('players').select('*').eq('room_code', roomCode).order('join_order'),
      supabase.from('game_state').select('*').eq('room_code', roomCode).single(),
    ]).then(([roomResult, playersResult, gsResult]) => {
      if (roomResult.error) {
        setError('ไม่พบห้องนี้')
      } else {
        setRoom(roomResult.data as Room)
      }
      if (!playersResult.error) {
        setPlayers(playersResult.data as Player[])
      }
      if (!gsResult.error && gsResult.data) {
        setGameState(gsResult.data as GameState)
      }
      setLoading(false)
    })

    // Single channel for all three tables
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') setRoom(payload.new as Room)
          if (payload.eventType === 'DELETE') setRoom(null)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) =>
              [...prev, payload.new as Player].sort((a, b) => a.join_order - b.join_order),
            )
          }
          if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) => (p.id === (payload.new as Player).id ? (payload.new as Player) : p)),
            )
          }
          if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as Player).id))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setGameState(payload.new as GameState)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  return { room, players, gameState, loading, error, setRoom, setPlayers, setGameState }
}
