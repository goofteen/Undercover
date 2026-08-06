import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { checkWinCondition, getEliminatedPlayer } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import paperTexture from '../../assets/textures/paper.png'
import noiseTexture from '../../assets/textures/noise.png'
import { getAvatar } from '../../lib/avatars'

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
        await supabase.from('game_state').update({
          phase: 'description',
          current_player_index: 0,
          round: gameState.round + 1,
          votes: {},
          descriptions: {},
        }).eq('room_code', room.room_code)
        return
      }

      await supabase.from('players').update({ is_eliminated: true }).eq('id', eliminatedPlayer.id)

      if (eliminatedPlayer.role === 'mrwhite') {
        await supabase.from('game_state').update({ phase: 'mrwhite_guess' }).eq('room_code', room.room_code)
        return
      }

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

    const timer = setTimeout(processElimination, 4500)
    return () => clearTimeout(timer)
  }, [isHost, eliminatedPlayer, isTie, processed])

  const voteSummary = Object.entries(gameState.votes)
    .filter(([id]) => id !== '__skip__')
    .map(([id, voters]) => ({ player: players.find((p) => p.id === id), count: voters.length }))
    .sort((a, b) => b.count - a.count)

  const roleLabel = eliminatedPlayer?.role === 'civilian' ? 'CIVILIAN'
    : eliminatedPlayer?.role === 'undercover' ? 'UNDERCOVER'
    : 'MR. WHITE'

  const roleColor = eliminatedPlayer?.role === 'undercover' ? '#D83A3A'
    : eliminatedPlayer?.role === 'mrwhite' ? '#B9BEC8'
    : '#6B8FD4'

  const aliveAfter = players.filter((p) => !p.is_eliminated && p.id !== eliminatedPlayer?.id).length

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0B0B15] relative overflow-hidden">
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Spotlight light cone */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: isTie
            ? 'radial-gradient(ellipse 320px 400px at 50% 30%, rgba(212,175,55,.14), transparent 65%)'
            : 'linear-gradient(rgba(246,232,195,.13), rgba(246,232,195,.02) 80%)',
          clipPath: isTie ? undefined : 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
        }}
      />
      {!isTie && (
        <div
          className="absolute pointer-events-none z-0"
          style={{
            left: '50%', top: '65%',
            transform: 'translateX(-50%)',
            width: '340px', height: '80px',
            borderRadius: '50%',
            background: 'rgba(246,232,195,.07)',
            filter: 'blur(10px)',
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-sm px-4 pt-8 pb-6 flex flex-col items-center">

        {isTie ? (
          /* ── TIE ── */
          <>
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <p className="font-heading text-3xl text-uc-gold tracking-wide mb-2">TIE</p>
              <p className="font-mono text-sm text-[#B9BEC8]">คะแนนเท่ากัน — ไม่มีใครถูกตัดออก</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 18 }}
              className="font-heading text-5xl text-uc-gold border-4 border-double border-uc-gold px-8 py-4 tracking-widest rotate-[-8deg]"
            >
              TIE
            </motion.div>
          </>
        ) : (
          /* ── ELIMINATION ── */
          <>
            {/* Large polaroid in spotlight */}
            <motion.div
              className="relative mb-6"
              style={{ transform: 'rotate(-2deg)' }}
              initial={{ opacity: 0, scale: 0.6, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Pin */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, #F27B6C, #C0392B 65%)', boxShadow: '0 3px 5px rgba(0,0,0,.45)' }}
              />
              <div
                className="relative bg-white pt-3 px-3 pb-10"
                style={{
                  backgroundImage: `url(${paperTexture})`,
                  backgroundSize: '150px',
                  boxShadow: '0 20px 50px rgba(0,0,0,.6)',
                }}
              >
                {/* Photo */}
                <div className="w-48 h-44 overflow-hidden" style={{ filter: 'grayscale(.4) brightness(.85)' }}>
                  <img
                    src={getAvatar(eliminatedPlayer?.name ?? '')}
                    alt={eliminatedPlayer?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* ELIMINATED stamp on photo */}
                <motion.div
                  initial={{ opacity: 0, scale: 2, rotate: -14 }}
                  animate={{ opacity: 0.92, scale: 1, rotate: -14 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.7, 0.35, 1] }}
                  className="absolute font-heading text-3xl text-[#D83A3A] border-[4px] border-double border-[#D83A3A] px-4 py-2 tracking-widest"
                  style={{
                    top: '42%', left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-14deg)',
                    letterSpacing: '.2em',
                    textShadow: '0 0 1px #D83A3A',
                  }}
                >
                  ELIMINATED
                </motion.div>

                {/* Name caption */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="font-mono text-sm text-[#2E2618] font-semibold">
                    {eliminatedPlayer?.name}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Role reveal card — dark */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="w-full rounded-2xl border border-white/10 mb-5 overflow-hidden"
              style={{ backgroundColor: '#16213E', boxShadow: '0 12px 32px rgba(0,0,0,.4)' }}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: `2px solid ${roleColor}` }}
                >
                  <img src={getAvatar(eliminatedPlayer?.name ?? '')} alt={eliminatedPlayer?.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#B9BEC8] tracking-[.2em] mb-0.5">ROLE REVEALED</p>
                  <p className="font-heading text-lg text-white">
                    {eliminatedPlayer?.name} was{' '}
                    <span style={{ color: roleColor }}>{roleLabel}</span>
                  </p>
                  <p className="font-mono text-xs text-[#B9BEC8] mt-0.5">
                    {aliveAfter} detectives remain
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Vote summary */}
        {voteSummary.length > 0 && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isTie ? 0.6 : 1.6 }}
          >
            <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase mb-2">Vote tally</p>
            <div className="space-y-1.5">
              {voteSummary.map(({ player, count }) => (
                <div
                  key={player?.id}
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{ backgroundImage: `url(${paperTexture})`, backgroundSize: '150px', backgroundColor: '#F6E8C3' }}
                >
                  <span className="font-mono text-xs text-[#2E2618]">{player?.name ?? '?'}</span>
                  <span className="font-mono text-xs text-[#6B5D3F] font-bold">{count} vote{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
              {(gameState.votes['__skip__']?.length ?? 0) > 0 && (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded opacity-60"
                  style={{ backgroundImage: `url(${paperTexture})`, backgroundSize: '150px', backgroundColor: '#F6E8C3' }}
                >
                  <span className="font-mono text-xs text-[#2E2618] italic">PASS</span>
                  <span className="font-mono text-xs text-[#6B5D3F] font-bold">{gameState.votes['__skip__'].length} vote{gameState.votes['__skip__'].length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.p
          className="text-center font-mono text-xs text-white/25 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isTie ? 1.2 : 2.2 }}
        >
          {isHost ? 'Continuing...' : 'Waiting for host...'}
        </motion.p>
      </div>
    </div>
  )
}
