import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'

const SKIP_KEY = '__skip__'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function VotingScreen({ room, players, gameState, localPlayer }: Props) {
  const [voted, setVoted] = useState(false)

  const alivePlayers = players.filter((p) => !p.is_eliminated)
  const myVote = Object.entries(gameState.votes).find(([, voters]) =>
    voters.includes(localPlayer.id)
  )?.[0]

  const hasVoted = !!myVote || voted

  // Count how many alive players have voted (including skips)
  const totalVoters = new Set(Object.values(gameState.votes).flat()).size
  const waitingFor = alivePlayers.length - totalVoters

  async function handleVote(targetId: string) {
    if (hasVoted) return
    setVoted(true)

    const currentVotes = { ...gameState.votes }
    if (!currentVotes[targetId]) currentVotes[targetId] = []
    currentVotes[targetId] = [...currentVotes[targetId], localPlayer.id]

    // Check if all alive players voted
    const allVoters = new Set(Object.values(currentVotes).flat())
    const allVoted = alivePlayers.every((p) => allVoters.has(p.id))

    await supabase.from('game_state').update({ votes: currentVotes }).eq('room_code', room.room_code)

    if (allVoted) {
      await supabase.from('game_state').update({ phase: 'elimination' }).eq('room_code', room.room_code)
    }
  }

  const voteCount = (playerId: string) => gameState.votes[playerId]?.length ?? 0
  const skipCount = gameState.votes[SKIP_KEY]?.length ?? 0
  const skippedByMe = myVote === SKIP_KEY

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🗳️</div>
          <h2 className="text-2xl font-bold text-gray-800">โหวตคนออก</h2>
          <p className="text-gray-500 text-sm mt-1">
            {hasVoted
              ? `รอ ${waitingFor} คน...`
              : 'เลือกผู้เล่นที่คุณสงสัย หรือข้ามโหวต'}
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {alivePlayers.map((p) => {
            const count = voteCount(p.id)
            const isSelf = p.id === localPlayer.id
            const isVotedFor = myVote === p.id
            return (
              <button
                key={p.id}
                onClick={() => !isSelf && handleVote(p.id)}
                disabled={hasVoted || isSelf}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition ${
                  isVotedFor
                    ? 'border-red-400 bg-red-50'
                    : isSelf
                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    : hasVoted
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{isSelf ? '🫵' : '👤'}</span>
                  <span className="font-medium text-gray-800">
                    {p.name} {isSelf && '(คุณ)'}
                  </span>
                </div>
                {hasVoted && count > 0 && (
                  <div className="flex items-center gap-1 text-red-500 font-bold">
                    <span>🔴</span><span>{count}</span>
                  </div>
                )}
                {isVotedFor && <span className="text-red-500 text-sm font-medium">✓ คุณโหวต</span>}
              </button>
            )
          })}

          {/* Skip vote button */}
          <button
            onClick={() => handleVote(SKIP_KEY)}
            disabled={hasVoted}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-dashed transition ${
              skippedByMe
                ? 'border-gray-400 bg-gray-100'
                : hasVoted
                ? 'border-gray-100 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⏭️</span>
              <span className="font-medium text-gray-600">ไม่โหวตใคร (ข้าม)</span>
            </div>
            {hasVoted && skipCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 font-bold">
                <span>⬜</span><span>{skipCount}</span>
              </div>
            )}
            {skippedByMe && <span className="text-gray-500 text-sm font-medium">✓ ข้าม</span>}
          </button>
        </div>

        {hasVoted && (
          <div className="text-center text-gray-400 text-sm py-2">
            รอผู้เล่นคนอื่นโหวต...
          </div>
        )}
      </div>
    </div>
  )
}
