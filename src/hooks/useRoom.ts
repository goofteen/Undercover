import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Player, Room } from '../types/game'

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) {
      setLoading(false)
      return
    }

    // Initial fetch
    Promise.all([
      supabase.from('rooms').select('*').eq('room_code', roomCode).single(),
      supabase.from('players').select('*').eq('room_code', roomCode).order('join_order'),
    ]).then(([roomResult, playersResult]) => {
      if (roomResult.error) {
        setError('ไม่พบห้องนี้')
      } else {
        setRoom(roomResult.data as Room)
      }
      if (!playersResult.error) {
        setPlayers(playersResult.data as Player[])
      }
      setLoading(false)
    })

    // Subscribe to rooms changes
    const roomSub = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') setRoom(payload.new as Room)
          if (payload.eventType === 'DELETE') setRoom(null)
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player].sort((a, b) => a.join_order - b.join_order))
          }
          if (payload.eventType === 'UPDATE') {
            setPlayers((prev) => prev.map((p) => p.id === (payload.new as Player).id ? payload.new as Player : p))
          }
          if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as Player).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomSub)
    }
  }, [roomCode])

  return { room, players, loading, error, setRoom, setPlayers }
}
