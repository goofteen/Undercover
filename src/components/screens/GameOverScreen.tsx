import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
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

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${4 + (i * 5.3) % 92}%`,
  color: ['#D4AF37', '#D83A3A', '#2ECC71', '#F6E8C3', '#3498DB', '#E91E63'][i % 6],
  width: 8 + (i % 4) * 3,
  height: 12 + (i % 3) * 5,
  delay: i * 0.18,
  duration: 5 + (i % 4) * 0.9,
  rotate: (i * 47) % 360,
}))

const ROLE_CONFIG = {
  civilian:   { label: 'CIVILIAN',   color: '#6B5D3F' },
  undercover: { label: 'UNDERCOVER', color: '#D83A3A' },
  mrwhite:    { label: 'MR. WHITE',  color: '#B3922B' },
} as const

const WINNER_CONFIG = {
  civilian: { text: 'CIVILIANS WIN',    color: '#2E2618' },
  impostor: { text: 'UNDERCOVER WINS',  color: '#D83A3A' },
  mrwhite:  { text: 'MR. WHITE WINS',   color: '#D4AF37' },
  null:     { text: 'CASE CLOSED',      color: '#2E2618' },
}

export default function GameOverScreen({ room, players, gameState, localPlayer }: Props) {
  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const isHost = myPlayer?.is_host
  const winner = gameState.winner
  const winCfg = WINNER_CONFIG[winner ?? 'null']

  async function handlePlayAgain() {
    await Promise.all([
      supabase.from('rooms').update({ status: 'lobby', word_pair: null }).eq('room_code', room.room_code),
      supabase.from('players').update({ role: null, is_eliminated: false }).eq('room_code', room.room_code),
      supabase.from('game_state').update({
        phase: 'lobby',
        current_player_index: 0,
        round: 1,
        votes: {},
        descriptions: {},
        winner: null,
      }).eq('room_code', room.room_code),
    ])
  }

  function handleLeave() {
    sessionStorage.removeItem('undercover_player')
    window.location.href = window.location.pathname
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] relative overflow-hidden">
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Confetti */}
      {CONFETTI.map((c) => (
        <motion.div
          key={c.id}
          className="absolute top-0 pointer-events-none z-20"
          style={{ left: c.left, width: c.width, height: c.height, backgroundColor: c.color, borderRadius: 2 }}
          initial={{ y: '-4vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: c.rotate + 720, opacity: 0.7 }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'linear' }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center px-4 py-8 max-w-md mx-auto">

        {/* Verdict ribbon */}
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.7, 0.35, 1] }}
          className="w-full mb-4 relative"
        >
          <div
            className="w-full py-6 px-10 flex flex-col items-center gap-1"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundSize: '200px',
              backgroundColor: '#F6E8C3',
              clipPath: 'polygon(3% 0, 97% 0, 100% 50%, 97% 100%, 3% 100%, 0 50%)',
              boxShadow: '0 16px 40px rgba(0,0,0,.5)',
            }}
          >
            <p className="font-mono text-xs text-[#6B5D3F] tracking-[.28em]">VERDICT REACHED</p>
            <p className="font-heading text-3xl tracking-wide" style={{ color: winCfg.color }}>
              {winCfg.text}
            </p>
          </div>

          {/* CASE CLOSED stamp — offset outside ribbon */}
          <motion.div
            initial={{ opacity: 0, scale: 2, rotate: 12 }}
            animate={{ opacity: 0.9, scale: 1, rotate: 12 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.7, 0.35, 1] }}
            className="absolute -right-2 -top-6 font-heading text-sm text-[#D83A3A] border-2 border-double border-[#D83A3A] px-3 py-1.5 tracking-widest"
            style={{ backgroundColor: 'rgba(26,26,46,.8)', letterSpacing: '.18em' }}
          >
            CASE CLOSED
          </motion.div>
        </motion.div>

        {/* Word pair reveal */}
        {room.word_pair && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full mb-4 rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundSize: '200px',
              backgroundColor: '#F6E8C3',
              boxShadow: '0 3px 10px rgba(20,16,4,.28)',
            }}
          >
            <div className="p-4">
              <p className="font-mono text-[10px] text-[#6B5D3F] tracking-[.24em] text-center mb-3">
                WORDS IN PLAY
              </p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="font-mono text-[9px] text-[#6B5D3F] tracking-wider mb-1">CIVILIAN</p>
                  <p className="font-heading text-xl text-[#2E2618]">{room.word_pair.civilian}</p>
                </div>
                <span className="font-heading text-[#6B5D3F]">vs</span>
                <div className="text-center">
                  <p className="font-mono text-[9px] text-[#D83A3A] tracking-wider mb-1">UNDERCOVER</p>
                  <p className="font-heading text-xl text-[#2E2618]">{room.word_pair.undercover}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Role summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full mb-4 rounded-lg overflow-hidden"
          style={{
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: '200px',
            backgroundColor: '#F6E8C3',
            boxShadow: '0 3px 10px rgba(20,16,4,.28)',
          }}
        >
          <div className="p-4">
            <p className="font-heading text-base text-[#2E2618] border-b-2 border-dashed border-[rgba(46,38,24,.3)] pb-2 mb-3">
              Role summary
            </p>
            <div className="space-y-0">
              {players.map((p, i) => {
                const roleCfg = ROLE_CONFIG[p.role ?? 'civilian']
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.07 }}
                    className="flex items-center gap-3 py-2 border-b border-dotted border-[rgba(46,38,24,.18)] last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src={getAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span
                      className="flex-1 text-sm text-[#2E2618]"
                      style={{ textDecoration: p.is_eliminated ? 'line-through' : 'none' }}
                    >
                      {p.name}
                      {p.id === localPlayer.id && (
                        <span className="font-mono text-[9px] text-[#6B5D3F] ml-1">(you)</span>
                      )}
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-wider border rounded-full px-2.5 py-0.5"
                      style={{ color: roleCfg.color, borderColor: roleCfg.color }}
                    >
                      {roleCfg.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="w-full flex flex-col gap-3 pb-4"
        >
          {isHost ? (
            <motion.button
              onClick={handlePlayAgain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 font-heading text-lg tracking-wide text-[#2E2618] relative overflow-visible"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: '200px',
                backgroundColor: '#F6E8C3',
                borderRadius: '0 8px 8px 8px',
                boxShadow: '0 3px 10px rgba(20,16,4,.28)',
              }}
            >
              {/* Tab */}
              <span
                className="absolute -top-3 left-0 w-14 h-3 rounded-t-lg"
                style={{ backgroundImage: `url(${paperTexture})`, backgroundColor: '#F6E8C3' }}
              />
              Play again
            </motion.button>
          ) : (
            <p className="text-center font-mono text-sm text-white/40">
              Waiting for host to start a new round…
            </p>
          )}

          <motion.button
            onClick={handleLeave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 font-heading text-base text-[#F6E8C3] border border-[#F6E8C3]/40 rounded-lg hover:border-[#F6E8C3]/70 hover:bg-[#F6E8C3]/5 transition-colors"
          >
            Back home
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
