import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { checkWinCondition, getEliminatedPlayer } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function EliminationScreen({ room, players, gameState, localPlayer }: Props) {
  const [processed, setProcessed] = useState(false)

  const eliminated = getEliminatedPlayer(gameState.votes)
  const eliminatedPlayer = players.find((p) => p.id === eliminated)
  const isTie = !eliminated

  const isHost = players.find((p) => p.id === localPlayer.id)?.is_host

  useEffect(() => {
    if (!isHost || processed) return
    if (!eliminatedPlayer && !isTie) return

    const processElimination = async () => {
      setProcessed(true)

      if (isTie || !eliminatedPlayer) {
        // Tie → no one eliminated, go back to description next round
        await supabase.from('game_state').update({
          phase: 'description',
          current_player_index: 0,
          round: gameState.round + 1,
          votes: {},
        }).eq('room_code', room.room_code)
        return
      }

      // Mark player as eliminated
      await supabase.from('players').update({ is_eliminated: true }).eq('id', eliminatedPlayer.id)

      // If Mr. White eliminated → give them a chance to guess
      if (eliminatedPlayer.role === 'mrwhite') {
        await supabase.from('game_state').update({ phase: 'mrwhite_guess' }).eq('room_code', room.room_code)
        return
      }

      // Check win condition with updated players list
      const updatedPlayers = players.map((p) =>
        p.id === eliminatedPlayer.id ? { ...p, is_eliminated: true } : p
      )
      const winner = checkWinCondition(updatedPlayers)

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

    // Small delay so players can read result
    const timer = setTimeout(processElimination, 4000)
    return () => clearTimeout(timer)
  }, [isHost, eliminatedPlayer, isTie, processed])

  // Sort votes for display
  const voteSummary = Object.entries(gameState.votes)
    .map(([playerId, voters]) => ({
      player: players.find((p) => p.id === playerId),
      count: voters.length,
    }))
    .sort((a, b) => b.count - a.count)

  const isEliminated = eliminatedPlayer?.id === localPlayer.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="text-5xl mb-4">{isTie ? '🤝' : '🚪'}</div>

        {isTie ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">เสมอกัน!</h2>
            <p className="text-gray-500 mb-6">คะแนนเท่ากัน ไม่มีใครถูกตัดออก — เล่นรอบใหม่</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isEliminated ? 'คุณถูกตัดออก!' : 'ผลการโหวต'}
            </h2>
            <div className="bg-gray-100 rounded-2xl px-6 py-4 mb-6 inline-block">
              <p className="text-gray-500 text-sm mb-1">ผู้เล่นที่ถูกตัดออก</p>
              <p className="text-3xl font-bold text-gray-800">{eliminatedPlayer?.name}</p>
            </div>

            {eliminatedPlayer?.role && (
              <p className="text-gray-600 mb-6">
                บทบาท:{' '}
                <span className={`font-bold ${
                  eliminatedPlayer.role === 'civilian' ? 'text-blue-500' :
                  eliminatedPlayer.role === 'undercover' ? 'text-red-500' : 'text-gray-700'
                }`}>
                  {eliminatedPlayer.role === 'civilian' ? 'พลเมือง 👤' :
                   eliminatedPlayer.role === 'undercover' ? 'สายลับ 🕵️' : 'Mr. White ❓'}
                </span>
              </p>
            )}
          </>
        )}

        {/* Vote summary */}
        <div className="text-left space-y-2 mt-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">สรุปคะแนนโหวต</p>
          {voteSummary.map(({ player, count }) => (
            <div key={player?.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
              <span className="text-gray-700">{player?.name}</span>
              <span className="font-bold text-gray-500">{count} โหวต</span>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-sm mt-6">
          {isHost ? 'กำลังไปต่อ...' : 'รอ Host...'}
        </p>
      </div>
    </div>
  )
}
