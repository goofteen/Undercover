import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import StampEffect from '../ui/StampEffect'
import AvatarBadge from '../ui/AvatarBadge'
import paperTexture from '../../assets/textures/paper.png'
import darkWallTexture from '../../assets/textures/dark-wall.png'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

/* ── confetti pieces ── */
const CONFETTI_COLORS = ['#D4AF37', '#D83A3A', '#2ECC71', '#F6E8C3', '#3498DB', '#E91E63']
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 11) % 98}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  width: 6 + (i % 4) * 3,
  height: 10 + (i % 3) * 4,
  delay: i * 0.15,
  duration: 2.5 + (i % 4) * 0.8,
  rotate: (i * 47) % 360,
}))

/* ── role badge config ── */
const ROLE_CONFIG = {
  civilian: { label: 'พลเมือง', bg: 'bg-uc-success', ring: 'ring-uc-success/30' },
  undercover: { label: 'สายลับ', bg: 'bg-uc-danger', ring: 'ring-uc-danger/30' },
  mrwhite: { label: 'Mr.White', bg: 'bg-gray-500', ring: 'ring-gray-400/30' },
} as const

/* ── winner banner config ── */
const WINNER_CONFIG = {
  civilian: {
    label: 'พลเมืองชนะ!',
    desc: 'พลเมืองสามารถจับสายลับทั้งหมดได้!',
    color: 'text-uc-success',
    borderColor: 'border-uc-success',
    bgGlow: 'rgba(46,204,113,0.12)',
  },
  impostor: {
    label: 'สายลับชนะ!',
    desc: 'สายลับอยู่รอดจนเหลือพลเมืองน้อยเกินไป!',
    color: 'text-uc-danger',
    borderColor: 'border-uc-danger',
    bgGlow: 'rgba(216,58,58,0.12)',
  },
  mrwhite: {
    label: 'Mr. White ชนะ!',
    desc: 'Mr. White เดาคำลับของพลเมืองถูก!',
    color: 'text-uc-gold',
    borderColor: 'border-uc-gold',
    bgGlow: 'rgba(212,175,55,0.12)',
  },
  null: {
    label: 'เกมจบแล้ว',
    desc: '',
    color: 'text-gray-400',
    borderColor: 'border-gray-500',
    bgGlow: 'rgba(100,100,100,0.08)',
  },
}

export default function GameOverScreen({ room, players, gameState, localPlayer }: Props) {
  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const isHost = myPlayer?.is_host
  const winner = gameState.winner

  const winnerCfg = WINNER_CONFIG[winner ?? 'null']

  const myRole = myPlayer?.role
  const myWord = myRole === 'civilian' ? room.word_pair?.civilian :
                 myRole === 'undercover' ? room.word_pair?.undercover : null

  // Determine if local player won
  const iWon = (winner === 'civilian' && myRole === 'civilian') ||
               (winner === 'impostor' && (myRole === 'undercover' || myRole === 'mrwhite')) ||
               (winner === 'mrwhite' && myRole === 'mrwhite')

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
    <div className="min-h-screen bg-uc-bg relative overflow-hidden">
      {/* Dark wall texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${darkWallTexture})`, backgroundSize: '300px' }}
      />

      {/* CSS confetti */}
      {CONFETTI_PIECES.map((c) => (
        <motion.div
          key={c.id}
          className="absolute top-0 pointer-events-none z-20"
          style={{
            left: c.left,
            width: c.width,
            height: c.height,
            backgroundColor: c.color,
            borderRadius: 1,
          }}
          initial={{ y: '-4vh', rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: c.rotate + 720, opacity: 0 }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-8 max-w-md mx-auto min-h-screen">

        {/* ── Winner Banner (ribbon shape) ── */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.7, 0.35, 1] }}
          className="w-full mb-6 mt-2"
        >
          <div
            className={`relative text-center py-5 px-6 border-2 ${winnerCfg.borderColor}`}
            style={{
              background: winnerCfg.bgGlow,
              clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)',
            }}
          >
            <h1 className={`font-heading text-3xl ${winnerCfg.color} tracking-wide`}>
              {winnerCfg.label}
            </h1>
            {winnerCfg.desc && (
              <p className="text-sm text-gray-400 font-body mt-1">{winnerCfg.desc}</p>
            )}
          </div>
        </motion.div>

        {/* ── CASE CLOSED stamp ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <StampEffect text="CASE CLOSED" color="gold" delay={0.6} />
        </motion.div>

        {/* ── Your result card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full mb-4 rounded-uc-2 overflow-hidden shadow-uc-paper relative"
          style={{
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: '200px',
          }}
        >
          <div className="absolute inset-0 bg-uc-paper/90" />
          <div className="relative p-5 text-center">
            <p className={`font-heading text-xl ${iWon ? 'text-uc-success' : 'text-uc-danger'}`}>
              {iWon ? 'คุณชนะ!' : 'คุณแพ้'}
            </p>
            {myWord && (
              <p className="text-uc-ink-soft text-sm font-body mt-1">
                คำของคุณคือ: <span className="font-bold text-uc-ink font-mono">{myWord}</span>
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Word pair reveal card ── */}
        {room.word_pair && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-full mb-4 rounded-uc-2 overflow-hidden shadow-uc-paper relative"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundSize: '200px',
            }}
          >
            <div className="absolute inset-0 bg-uc-paper/90" />
            <div className="relative p-5">
              <p className="text-xs text-uc-ink-soft font-heading uppercase tracking-widest text-center mb-3">
                คู่คำในเกมนี้
              </p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-uc-success font-heading mb-1">พลเมือง</p>
                  <p className="text-xl font-bold text-uc-ink font-mono">{room.word_pair.civilian}</p>
                </div>
                <span className="text-uc-ink-soft text-lg font-heading">vs</span>
                <div className="text-center">
                  <p className="text-xs text-uc-danger font-heading mb-1">สายลับ</p>
                  <p className="text-xl font-bold text-uc-ink font-mono">{room.word_pair.undercover}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── All players list ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-full mb-6"
        >
          <p className="text-xs text-gray-500 font-heading uppercase tracking-widest mb-3 px-1">
            บทบาทผู้เล่น
          </p>
          <div className="space-y-2">
            {players.map((p, i) => {
              const roleCfg = ROLE_CONFIG[p.role ?? 'civilian']
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.08, duration: 0.4 }}
                  className="flex items-center justify-between rounded-uc-2 overflow-hidden shadow-uc-paper relative"
                  style={{
                    backgroundImage: `url(${paperTexture})`,
                    backgroundSize: '200px',
                  }}
                >
                  <div className="absolute inset-0 bg-uc-paper/90" />
                  <div className="relative flex items-center gap-3 px-4 py-3 w-full">
                    <AvatarBadge name={p.name} size="sm" eliminated={p.is_eliminated} textTheme="light" />
                    <div className="flex-1 min-w-0">
                      <span className="text-uc-ink font-body text-sm truncate block">
                        {p.name}
                        {p.id === localPlayer.id && (
                          <span className="text-xs text-uc-gold ml-1 font-heading">(คุณ)</span>
                        )}
                      </span>
                    </div>
                    {/* Role badge */}
                    <span
                      className={`${roleCfg.bg} ring-2 ${roleCfg.ring} text-white text-xs font-heading px-3 py-1 rounded-full`}
                    >
                      {roleCfg.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="w-full space-y-3 pb-4"
        >
          {isHost ? (
            <motion.button
              onClick={handlePlayAgain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-uc-2 font-heading text-lg shadow-uc-paper relative overflow-hidden"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: '200px',
              }}
            >
              <div className="absolute inset-0 bg-uc-paper/90" />
              <span className="relative text-uc-ink">เล่นอีกรอบ</span>
            </motion.button>
          ) : (
            <p className="text-gray-500 text-sm font-body text-center">รอ Host เริ่มรอบใหม่...</p>
          )}

          <motion.button
            onClick={handleLeave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-uc-2 border-2 border-gray-500/40 text-gray-400 font-heading text-base hover:border-gray-400/60 hover:text-gray-300 transition-colors"
          >
            กลับหน้าหลัก
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
