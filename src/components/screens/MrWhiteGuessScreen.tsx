import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkWinCondition } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function MrWhiteGuessScreen({ room, players, gameState, localPlayer }: Props) {
  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mrwhitePlayer = players.find((p) => p.role === 'mrwhite' && p.is_eliminated)
  const isMrWhite = mrwhitePlayer?.id === localPlayer.id

  async function handleGuess() {
    if (!guess.trim()) return
    setSubmitted(true)

    const civilianWord = room.word_pair?.civilian ?? ''
    const correct = guess.trim().toLowerCase() === civilianWord.toLowerCase()

    if (correct) {
      await supabase.from('game_state').update({ phase: 'gameover', winner: 'mrwhite' }).eq('room_code', room.room_code)
    } else {
      // Mr. White guessed wrong — check remaining win condition
      const winner = checkWinCondition(players)
      if (winner) {
        await supabase.from('game_state').update({ phase: 'gameover', winner }).eq('room_code', room.room_code)
      } else {
        await supabase.from('game_state').update({
          phase: 'description',
          current_player_index: 0,
          round: gameState.round + 1,
          votes: {},
        }).eq('room_code', room.room_code)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="text-5xl mb-4">❓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mr. White ถูกจับแล้ว!</h2>
        <p className="text-gray-500 mb-6">
          {mrwhitePlayer?.name} ยังมีโอกาสเดาคำของพลเมือง — ถ้าเดาถูก Mr. White ชนะ!
        </p>

        {isMrWhite ? (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">คุณคิดว่าคำลับของพลเมืองคืออะไร?</p>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="พิมพ์คำเดา..."
              disabled={submitted}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-center focus:border-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleGuess}
              disabled={submitted || !guess.trim()}
              className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white text-lg font-semibold rounded-2xl transition disabled:opacity-50"
            >
              {submitted ? 'รอผล...' : 'ส่งคำตอบ'}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-500">รอ {mrwhitePlayer?.name} เดาคำ...</p>
          </div>
        )}
      </div>
    </div>
  )
}
