import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { checkWinCondition, getEliminatedPlayer } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import StampEffect from '../ui/StampEffect'
import AvatarBadge from '../ui/AvatarBadge'
import darkWallTexture from '../../assets/textures/dark-wall.png'
import paperTexture from '../../assets/textures/paper.png'

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
          descriptions: {},
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
          descriptions: {},
        }).eq('room_code', room.room_code)
      }
    }

    // Small delay so players can read result
    const timer = setTimeout(processElimination, 4000)
    return () => clearTimeout(timer)
  }, [isHost, eliminatedPlayer, isTie, processed])

  // Sort votes for display
  const voteSummary = Object.entries(gameState.votes)
    .filter(([playerId]) => playerId !== '__skip__')
    .map(([playerId, voters]) => ({
      player: players.find((p) => p.id === playerId),
      count: voters.length,
    }))
    .sort((a, b) => b.count - a.count)

  const isEliminated = eliminatedPlayer?.id === localPlayer.id

  const roleLabel = eliminatedPlayer?.role === 'civilian'
    ? 'พลเมือง'
    : eliminatedPlayer?.role === 'undercover'
    ? 'สายลับ'
    : 'Mr. White'

  const roleColor = eliminatedPlayer?.role === 'civilian'
    ? 'text-blue-400'
    : eliminatedPlayer?.role === 'undercover'
    ? 'text-uc-danger'
    : 'text-white/70'

  const roleBorderColor = eliminatedPlayer?.role === 'civilian'
    ? 'border-blue-400/40'
    : eliminatedPlayer?.role === 'undercover'
    ? 'border-uc-danger/40'
    : 'border-white/20'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `url(${darkWallTexture}) center/cover`,
        backgroundColor: '#0a0a14',
      }}
    >
      {/* Dark overlay for extra drama */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none" />

      {/* Spotlight effect from above */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 320px 500px at 50% 30%, rgba(212,175,55,0.12) 0%, rgba(255,248,220,0.04) 30%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-2xl text-uc-gold tracking-wider">
            {isTie ? 'ผลการโหวต' : isEliminated ? 'คุณถูกจับได้!' : 'ผลการโหวต'}
          </h2>
        </motion.div>

        {isTie ? (
          /* ── Tie result ── */
          <div className="flex flex-col items-center">
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-heading text-xl text-uc-paper mb-4">เสมอกัน!</p>
              <p className="text-white/50 font-body text-sm mb-6">
                คะแนนเท่ากัน ไม่มีใครถูกตัดออก — เล่นรอบใหม่
              </p>
            </motion.div>

            {/* Gold TIE stamp */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <StampEffect text="TIE" color="gold" delay={0.6} />
            </motion.div>
          </div>
        ) : (
          /* ── Elimination result ── */
          <div className="flex flex-col items-center">
            {/* Eliminated player under spotlight */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <AvatarBadge
                name={eliminatedPlayer?.name ?? '?'}
                size="lg"
                eliminated
              />
            </motion.div>

            {/* Name */}
            <motion.p
              className="font-heading text-2xl text-uc-paper mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {eliminatedPlayer?.name}
            </motion.p>

            {/* ELIMINATED stamp */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <StampEffect text="ELIMINATED" color="red" delay={0.7} />
            </motion.div>

            {/* Role reveal card */}
            {eliminatedPlayer?.role && (
              <motion.div
                className={`rounded-uc-2 px-6 py-4 mt-2 mb-6 border ${roleBorderColor} shadow-uc-paper text-center`}
                style={{
                  backgroundImage: `url(${paperTexture})`,
                  backgroundSize: 'cover',
                }}
                initial={{ opacity: 0, y: 20, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 1.2, duration: 0.5, ease: 'easeOut' }}
              >
                <p className="text-xs text-uc-ink-soft font-mono uppercase tracking-widest mb-1">
                  บทบาทที่แท้จริง
                </p>
                <p className={`font-heading text-xl ${roleColor}`}>
                  {roleLabel}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Vote summary — paper notes */}
        <motion.div
          className="mt-4 space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
        >
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-2">
            สรุปคะแนนโหวต
          </p>
          {voteSummary.map(({ player, count }) => (
            <div
              key={player?.id}
              className="rounded-uc px-3 py-2 shadow-uc-soft flex items-center justify-between"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: 'cover',
              }}
            >
              <span className="font-body text-uc-ink text-sm">{player?.name ?? '?'}</span>
              <span className="font-mono text-xs text-uc-ink-soft font-bold">{count} โหวต</span>
            </div>
          ))}
          {(gameState.votes['__skip__']?.length ?? 0) > 0 && (
            <div
              className="rounded-uc px-3 py-2 shadow-uc-soft flex items-center justify-between opacity-60"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: 'cover',
              }}
            >
              <span className="font-body text-uc-ink text-sm italic">ข้ามโหวต</span>
              <span className="font-mono text-xs text-uc-ink-soft font-bold">{gameState.votes['__skip__'].length} โหวต</span>
            </div>
          )}
        </motion.div>

        {/* Status */}
        <motion.p
          className="text-center text-white/30 text-sm font-mono mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          {isHost ? 'กำลังไปต่อ...' : 'รอ Host...'}
        </motion.p>
      </div>
    </div>
  )
}
