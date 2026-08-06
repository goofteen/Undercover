import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import corkTexture from '../../assets/textures/cork.png'
import paperTexture from '../../assets/textures/paper.png'
import noiseTexture from '../../assets/textures/noise.png'
import { getAvatar } from '../../lib/avatars'

const SKIP_KEY = '__skip__'
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1.5, -3, 2, -1.5, 3, -2, 1.5]

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
  const myVote = myVoteFromDB ?? localVotedFor
  const hasVoted = !!myVote

  const allVoterIds = new Set(Object.values(votes).flat())
  const totalVoters = allVoterIds.size

  async function handleVote(targetId: string) {
    if (hasVoted) return
    setLocalVotedFor(targetId)
    const currentVotes = { ...votes }
    if (!currentVotes[targetId]) currentVotes[targetId] = []
    currentVotes[targetId] = [...currentVotes[targetId], localPlayer.id]
    const allVoters = new Set(Object.values(currentVotes).flat())
    const allVoted = alivePlayers.every((p) => allVoters.has(p.id))
    await supabase.from('game_state').update({
      votes: currentVotes,
      ...(allVoted ? { phase: 'elimination' } : {}),
    }).eq('room_code', room.room_code)
  }

  const accusedName = myVote && myVote !== SKIP_KEY
    ? alivePlayers.find((p) => p.id === myVote)?.name?.toUpperCase()
    : null

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A2E] relative overflow-hidden">
      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-8 pb-4">
        <h2 className="font-heading text-2xl text-white tracking-wide leading-tight">
          Who is the<br />undercover?
        </h2>
        <div className="font-mono text-xs text-uc-gold border border-uc-gold rounded-full px-3 py-1.5 tracking-widest flex-shrink-0">
          {totalVoters} / {alivePlayers.length} VOTED
        </div>
      </div>

      {/* Cork board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex-1 mx-4 rounded-2xl overflow-hidden"
        style={{
          border: '12px solid #6E4A26',
          backgroundImage: `url(${corkTexture})`,
          backgroundColor: '#A87848',
          backgroundSize: '200px',
          boxShadow: 'inset 0 4px 18px rgba(0,0,0,.35), 0 12px 32px rgba(0,0,0,.4)',
          minHeight: '280px',
        }}
      >
        <div className="flex flex-wrap gap-5 justify-center p-5 pt-7">
          {alivePlayers.map((p, i) => {
            const isVotedFor = myVote === p.id
            const isSelf = p.id === localPlayer.id
            const hasThisPlayerVoted = allVoterIds.has(p.id)
            const voteCount = votes[p.id]?.length ?? 0
            const rot = ROTATIONS[i % ROTATIONS.length]
            const avatar = getAvatar(p.name)

            return (
              <motion.div
                key={p.id}
                className={`relative ${!hasVoted && !isSelf ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ rotate: `${isVotedFor ? 0 : rot}deg` }}
                onClick={() => !hasVoted && !isSelf && handleVote(p.id)}
                whileHover={!hasVoted && !isSelf ? { scale: 1.06, rotate: '0deg' } : {}}
                whileTap={!hasVoted && !isSelf ? { scale: 0.97 } : {}}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
              >
                {/* Red pin */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #F27B6C, #C0392B 65%)',
                    boxShadow: '0 3px 5px rgba(0,0,0,.45)',
                  }}
                />
                {/* Polaroid */}
                <div
                  className={`relative bg-white pt-2 px-2 pb-7 ${isSelf ? 'opacity-40' : ''}`}
                  style={{
                    boxShadow: isVotedFor
                      ? '0 0 0 2px rgba(216,58,58,.6), 0 10px 28px rgba(20,16,4,.45)'
                      : '0 6px 16px rgba(20,16,4,.4)',
                    backgroundImage: `url(${paperTexture})`,
                    backgroundSize: '150px',
                  }}
                >
                  {/* Photo */}
                  <div className="w-[76px] h-[68px] overflow-hidden">
                    <img src={avatar} alt={p.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Crosshair overlay */}
                  {isVotedFor && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <div
                        className="absolute rounded-full border-2 border-[#D83A3A]"
                        style={{ inset: '10px', boxShadow: '0 0 18px rgba(216,58,58,.5)' }}
                      />
                      <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-[#D83A3A] -translate-x-1/2" />
                      <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#D83A3A] -translate-y-1/2" />
                    </motion.div>
                  )}

                  {/* VOTED ribbon */}
                  {hasThisPlayerVoted && (
                    <div className="absolute top-2 -right-1.5 rotate-[12deg] font-mono text-[7px] tracking-wider text-white bg-[#2ECC71] rounded px-1.5 py-0.5 shadow-sm">
                      VOTED
                    </div>
                  )}

                  {/* Vote count badge */}
                  {hasVoted && voteCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#D83A3A] flex items-center justify-center text-white text-xs font-bold shadow-md z-20"
                    >
                      {voteCount}
                    </motion.div>
                  )}

                  {/* Caption */}
                  <div className="absolute bottom-1 left-0 right-0 text-center px-1">
                    <span className="font-mono text-[10px] text-[#2E2618] font-semibold truncate block">
                      {p.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Bottom action row */}
      <div className="relative z-10 flex justify-center items-center gap-4 px-5 py-5">
        {/* PASS */}
        <button
          onClick={() => handleVote(SKIP_KEY)}
          disabled={hasVoted}
          className={`font-heading text-base tracking-widest px-7 py-3 rounded-lg border-2 border-double transition-all ${
            myVote === SKIP_KEY
              ? 'border-[#B9BEC8] text-white'
              : hasVoted
              ? 'border-[#B9BEC8]/20 text-[#B9BEC8]/20 cursor-default'
              : 'border-[#B9BEC8] text-[#B9BEC8] hover:text-white hover:border-white active:scale-[0.98]'
          }`}
          style={{ transform: 'rotate(-1deg)' }}
        >
          PASS
        </button>

        {/* ACCUSE label / result */}
        {accusedName ? (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-heading text-base tracking-widest px-7 py-3 rounded-lg border-2 border-double border-[#D83A3A] text-[#D83A3A]"
            style={{ transform: 'rotate(1deg)', boxShadow: '0 0 22px rgba(216,58,58,.2)' }}
          >
            ACCUSED: {accusedName}
          </motion.div>
        ) : (
          <div
            className={`font-heading text-base tracking-widest px-7 py-3 rounded-lg border-2 border-double transition-all ${
              hasVoted
                ? 'border-[#D83A3A]/20 text-[#D83A3A]/20'
                : 'border-[#D83A3A]/40 text-[#D83A3A]/40'
            }`}
            style={{ transform: 'rotate(1deg)' }}
          >
            ACCUSE ???
          </div>
        )}
      </div>
    </div>
  )
}
