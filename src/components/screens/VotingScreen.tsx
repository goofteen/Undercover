import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, SkipForward } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import AvatarBadge from '../ui/AvatarBadge'
import corkTexture from '../../assets/textures/cork.png'
import paperTexture from '../../assets/textures/paper.png'

const SKIP_KEY = '__skip__'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function VotingScreen({ room, players, gameState, localPlayer }: Props) {
  const [localVotedFor, setLocalVotedFor] = useState<string | null>(null)

  const alivePlayers = players.filter((p) => !p.is_eliminated)
  const votes = gameState.votes ?? {}
  const myVoteFromDB = Object.entries(votes).find(([, voters]) =>
    voters.includes(localPlayer.id)
  )?.[0]

  // Optimistic: use local state until DB confirms
  const myVote = myVoteFromDB ?? localVotedFor
  const hasVoted = !!myVote

  // Count how many alive players have voted (including skips)
  const allVoterIds = new Set(Object.values(votes).flat())
  const totalVoters = allVoterIds.size
  const waitingFor = alivePlayers.length - totalVoters

  async function handleVote(targetId: string) {
    if (hasVoted) return

    // Optimistic update — instant UI feedback
    setLocalVotedFor(targetId)

    const currentVotes = { ...votes }
    if (!currentVotes[targetId]) currentVotes[targetId] = []
    currentVotes[targetId] = [...currentVotes[targetId], localPlayer.id]

    // Check if all alive players voted
    const allVoters = new Set(Object.values(currentVotes).flat())
    const allVoted = alivePlayers.every((p) => allVoters.has(p.id))

    // Single update — include phase change when all voted to avoid a second round-trip
    await supabase.from('game_state').update({
      votes: currentVotes,
      ...(allVoted ? { phase: 'elimination' } : {}),
    }).eq('room_code', room.room_code)
  }

  const voteCount = (playerId: string) => votes[playerId]?.length ?? 0
  const skipCount = votes[SKIP_KEY]?.length ?? 0
  const skippedByMe = myVote === SKIP_KEY

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-uc-bg"
    >
      {/* Cork board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-uc-2 shadow-uc-large overflow-hidden"
        style={{
          border: '12px solid #5C3D1E',
          borderImage: 'linear-gradient(145deg, #7B5B3A 0%, #3E2712 40%, #5C3D1E 60%, #7B5B3A 100%) 12',
        }}
      >
        <div
          className="relative p-5"
          style={{
            backgroundImage: `url(${corkTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-center mb-5"
          >
            <h2 className="font-heading text-2xl text-uc-gold drop-shadow-md">
              <span className="mr-2">&#x1f5f3;&#xfe0f;</span>
              ลงมติโหวต
            </h2>
            <p className="font-body text-sm text-uc-paper/80 mt-1">
              {hasVoted
                ? `รอ ${waitingFor} คน...`
                : 'เลือกผู้เล่นที่คุณสงสัย หรือข้ามโหวต'}
            </p>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="text-center mb-4"
          >
            <span className="font-mono text-sm text-uc-gold">
              โหวตแล้ว {totalVoters}/{alivePlayers.length} คน
            </span>
          </motion.div>

          {/* Player grid */}
          <div className="flex flex-wrap justify-center gap-4 mb-5">
            {alivePlayers.map((p, i) => {
              const count = voteCount(p.id)
              const isSelf = p.id === localPlayer.id
              const isVotedFor = myVote === p.id
              const hasThisPlayerVoted = allVoterIds.has(p.id)

              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                  onClick={() => handleVote(p.id)}
                  disabled={hasVoted || isSelf}
                  className={`relative flex flex-col items-center w-[calc(33.333%-1rem)] min-w-[80px] group ${
                    isSelf ? 'opacity-40 cursor-not-allowed' : hasVoted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* Pin */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-md border border-red-900/40" />

                  {/* Avatar container */}
                  <div className="relative mt-1">
                    <AvatarBadge
                      name={p.name}
                      size="lg"
                      selected={isVotedFor}
                    />

                    {/* Red crosshair overlay when voted for */}
                    {isVotedFor && (
                      <motion.div
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-16 h-16 rounded-full border-[3px] border-uc-danger relative">
                          {/* Crosshair horizontal line */}
                          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-uc-danger -translate-y-1/2" />
                          {/* Crosshair vertical line */}
                          <div className="absolute left-1/2 top-0 h-full w-[2px] bg-uc-danger -translate-x-1/2" />
                        </div>
                      </motion.div>
                    )}

                    {/* Hover crosshair for non-self, not-yet-voted */}
                    {!hasVoted && !isSelf && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                        <Crosshair size={40} weight="bold" className="text-uc-danger" />
                      </div>
                    )}

                    {/* Vote status badge */}
                    {hasThisPlayerVoted ? (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-uc-success rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm z-20">
                        &#x2713;
                      </div>
                    ) : (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400/60 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm z-20">
                        &#x23F3;
                      </div>
                    )}

                    {/* Vote count badge */}
                    {hasVoted && count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 bg-uc-danger rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md z-20"
                      >
                        {count}
                      </motion.div>
                    )}
                  </div>

                  {/* Player name label */}
                  <span className={`mt-1 text-xs font-mono truncate max-w-[72px] ${
                    isSelf ? 'text-uc-paper/50' : 'text-uc-paper'
                  }`}>
                    {p.name} {isSelf && '(คุณ)'}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Skip vote - paper stamp style */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + alivePlayers.length * 0.06, duration: 0.35 }}
            className="flex justify-center"
          >
            <button
              onClick={() => handleVote(SKIP_KEY)}
              disabled={hasVoted}
              className={`relative group px-6 py-3 rounded-uc transition-all duration-200 ${
                skippedByMe
                  ? 'opacity-100'
                  : hasVoted
                  ? 'opacity-40 cursor-default'
                  : 'cursor-pointer hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: 'cover',
              }}
            >
              <div className="flex items-center gap-2">
                <SkipForward size={20} weight="bold" className="text-uc-ink-soft" />
                <span className="font-heading text-uc-ink tracking-wide uppercase text-sm">
                  PASS
                </span>
              </div>

              {/* Stamp overlay when selected */}
              {skippedByMe && (
                <motion.div
                  initial={{ opacity: 0, scale: 3, rotate: -14 }}
                  animate={{ opacity: 1, scale: 1, rotate: -14 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.7, 0.35, 1] }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="border-[3px] border-uc-danger rounded-uc px-3 py-1">
                    <span className="font-heading text-uc-danger text-lg tracking-widest">
                      PASS
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Skip count badge */}
              {hasVoted && skipCount > 0 && (
                <div className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {skipCount}
                </div>
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
