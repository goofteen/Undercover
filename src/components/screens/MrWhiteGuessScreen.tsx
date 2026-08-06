import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { checkWinCondition } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import paperTexture from '../../assets/textures/paper.png'
import darkWallTexture from '../../assets/textures/dark-wall.png'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

const FLOATING_MARKS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 47 + 13) % 90}%`,
  top: `${3 + (i * 31 + 7) % 88}%`,
  size: 18 + (i % 4) * 8,
  delay: i * 0.4,
  duration: 4 + (i % 3) * 1.5,
}))

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
          descriptions: {},
        }).eq('room_code', room.room_code)
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #0d0d1a 0%, #12122a 100%)`,
      }}
    >
      {/* Dark wall texture overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${darkWallTexture})`, backgroundSize: '300px' }}
      />

      {/* Floating question marks */}
      {FLOATING_MARKS.map((m) => (
        <motion.span
          key={m.id}
          className="absolute font-heading text-uc-gold pointer-events-none select-none"
          style={{
            left: m.left,
            top: m.top,
            fontSize: m.size,
            opacity: 0.08,
          }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ?
        </motion.span>
      ))}

      {/* Center card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.7, 0.35, 1] }}
        className="relative w-full max-w-md bg-uc-surface border-2 border-uc-gold rounded-uc-2 shadow-uc-large p-8 text-center z-10"
      >
        {/* Subtle gold corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-uc-gold rounded-tl-uc-2 opacity-60" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-uc-gold rounded-tr-uc-2 opacity-60" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-uc-gold rounded-bl-uc-2 opacity-60" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-uc-gold rounded-br-uc-2 opacity-60" />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="font-heading text-2xl text-uc-danger mb-2">
            Mr. White ถูกจับแล้ว!
          </h2>
          <p className="text-sm text-uc-gold/70 font-body mb-6">
            {mrwhitePlayer?.name} ยังมีโอกาสเดาคำของพลเมือง -- ถ้าเดาถูก Mr. White ชนะ!
          </p>
        </motion.div>

        {isMrWhite ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-5"
          >
            <p className="text-uc-paper font-body text-sm">
              คุณคิดว่าคำลับของพลเมืองคืออะไร?
            </p>

            {/* Typewriter-style input */}
            <div className="relative">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                placeholder="พิมพ์คำเดา..."
                disabled={submitted}
                autoFocus
                className="w-full bg-transparent border-b-2 border-uc-gold px-3 py-3 text-xl text-center font-mono text-uc-paper placeholder:text-uc-ink-soft/40 focus:outline-none focus:border-uc-gold disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Submit button */}
            <motion.button
              onClick={handleGuess}
              disabled={submitted || !guess.trim()}
              whileHover={!submitted && guess.trim() ? { scale: 1.02 } : {}}
              whileTap={!submitted && guess.trim() ? { scale: 0.97 } : {}}
              className="w-full py-4 bg-uc-danger hover:bg-uc-danger-dark text-white text-lg font-heading rounded-uc-2 transition-colors shadow-uc-large disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitted ? 'รอผล...' : 'ส่งคำตอบ'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative rounded-uc-2 p-6 overflow-hidden"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundSize: '200px',
            }}
          >
            {/* Paper note look */}
            <div className="absolute inset-0 bg-uc-paper/90" />
            <div className="relative">
              <motion.p
                className="text-uc-ink-soft font-body text-base"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                รอ {mrwhitePlayer?.name} เดาคำ...
              </motion.p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
