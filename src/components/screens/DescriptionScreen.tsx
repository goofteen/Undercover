import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import { getDescriptionOrder } from '../../lib/gameLogic'
import { getWordForRole } from '../../lib/gameLogic'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function DescriptionScreen({ room, players, gameState, localPlayer }: Props) {
  const turnTime = room.turn_time_sec ?? 60
  const [timeLeft, setTimeLeft] = useState(turnTime)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const order = getDescriptionOrder(players)
  const currentSpeaker = order[gameState.current_player_index]
  const isMyTurn = currentSpeaker?.id === localPlayer.id

  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const myRole = myPlayer?.role ?? null
  const myWord = myRole && room.word_pair ? getWordForRole(myRole, room.word_pair) : null

  // Reset timer when speaker changes
  useEffect(() => {
    setTimeLeft(turnTime)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState.current_player_index, turnTime])

  async function handleNext() {
    const nextIndex = gameState.current_player_index + 1
    if (nextIndex >= order.length) {
      // All players described → move to voting
      await supabase.from('game_state').update({ phase: 'voting', votes: {} }).eq('room_code', room.room_code)
    } else {
      await supabase.from('game_state').update({ current_player_index: nextIndex }).eq('room_code', room.room_code)
    }
  }

  const speakerIndex = gameState.current_player_index + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-pink-500 to-rose-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
            รอบที่ {gameState.round} • อธิบายคำ {speakerIndex}/{order.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-4">
          <div className={`text-5xl font-bold font-mono ${
            timeLeft <= 10 ? 'text-red-500 animate-pulse' : timeLeft <= 30 ? 'text-orange-500' : 'text-gray-700'
          }`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-orange-400' : 'bg-green-400'
            }`}
            style={{ width: `${(timeLeft / turnTime) * 100}%` }}
          />
        </div>

        {/* Current speaker */}
        <div className={`rounded-2xl p-6 text-center mb-6 ${
          isMyTurn ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' : 'bg-gray-50'
        }`}>
          <div className="text-4xl mb-2">{isMyTurn ? '🎤' : '👂'}</div>
          <p className={`text-sm mb-1 ${isMyTurn ? 'text-yellow-100' : 'text-gray-500'}`}>
            {isMyTurn ? 'ถึงตาของคุณแล้ว!' : 'กำลังอธิบาย'}
          </p>
          <p className={`text-2xl font-bold ${isMyTurn ? 'text-white' : 'text-gray-800'}`}>
            {currentSpeaker?.name ?? '—'}
          </p>
          {isMyTurn && (
            <p className="text-yellow-100 text-sm mt-2">อธิบายคำลับของคุณโดยไม่พูดตรงๆ</p>
          )}
          {timeLeft === 0 && (
            <p className="text-red-500 text-sm mt-2 font-bold bg-white rounded-lg py-1">⏰ หมดเวลา!</p>
          )}
        </div>

        {/* My word reminder */}
        {myWord && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-blue-400">💡</span>
            <div>
              <p className="text-xs text-blue-500">คำลับของคุณ</p>
              <p className="font-bold text-blue-800">{myWord}</p>
            </div>
          </div>
        )}
        {!myWord && myRole === 'mrwhite' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-gray-500">คุณคือ Mr. White — ไม่มีคำลับ แต่แอบฟังให้ดี!</p>
          </div>
        )}

        {/* Player list */}
        <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
          {order.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                i === gameState.current_player_index
                  ? 'bg-yellow-50 border-2 border-yellow-300 font-semibold'
                  : i < gameState.current_player_index
                  ? 'text-gray-400 line-through'
                  : 'text-gray-600'
              }`}
            >
              <span>{i < gameState.current_player_index ? '✓' : i === gameState.current_player_index ? '🎤' : `${i + 1}.`}</span>
              <span>{p.name}</span>
              {p.id === localPlayer.id && <span className="ml-auto text-xs text-blue-500">(คุณ)</span>}
            </div>
          ))}
        </div>

        {/* Next button — only current speaker (or host) can advance */}
        {(isMyTurn || myPlayer?.is_host) && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl transition shadow-lg"
          >
            {gameState.current_player_index + 1 >= order.length ? 'ไปโหวตได้เลย →' : 'ถัดไป →'}
          </button>
        )}
      </div>
    </div>
  )
}
