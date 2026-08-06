import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { checkWinCondition } from '../../lib/gameLogic'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import noiseTexture from '../../assets/textures/noise.png'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

const MARKS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 53 + 11) % 88}%`,
  top: `${5 + (i * 37 + 7) % 82}%`,
  size: 40 + (i % 4) * 28,
  delay: i * 0.35,
  duration: 4 + (i % 3) * 1.8,
  rotate: (i * 47) % 360,
}))

export default function MrWhiteGuessScreen({ room, players, gameState, localPlayer }: Props) {
  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mrwhitePlayer = players.find((p) => p.role === 'mrwhite' && p.is_eliminated)
  const isMrWhite = mrwhitePlayer?.id === localPlayer.id

  async function handleGuess() {
    if (!guess.trim() || submitted) return
    setSubmitted(true)
    const civilianWord = room.word_pair?.civilian ?? ''
    const correct = guess.trim().toLowerCase() === civilianWord.toLowerCase()

    if (correct) {
      await supabase.from('game_state').update({ phase: 'gameover', winner: 'mrwhite' }).eq('room_code', room.room_code)
    } else {
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
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#0E0E1A' }}
    >
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(246,232,195,.08), transparent 55%)' }}
      />

      {/* Floating ? marks */}
      {MARKS.map((m) => (
        <motion.span
          key={m.id}
          className="absolute font-heading pointer-events-none select-none z-0"
          style={{
            left: m.left, top: m.top,
            fontSize: m.size,
            color: m.id % 3 === 0 ? 'rgba(212,175,55,.08)' : 'rgba(246,232,195,.06)',
          }}
          animate={{ y: [0, -20, 0], rotate: [m.rotate, m.rotate + 12, m.rotate - 12, m.rotate] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          ?
        </motion.span>
      ))}

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-7">
        {/* Heading */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl text-white tracking-wide mb-2">
            Mr. White, last chance.
          </h2>
          <p className="font-mono text-sm text-[#B9BEC8]">
            {isMrWhite
              ? 'Guess the secret word to steal the case.'
              : `${mrwhitePlayer?.name ?? 'Mr. White'} is making their guess…`}
          </p>
        </motion.div>

        {isMrWhite ? (
          <motion.div
            className="w-full flex flex-col gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {/* Input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#B9BEC8] tracking-[.18em]">YOUR GUESS</label>
              <div
                className="flex items-baseline gap-2"
                style={{ borderBottom: '3px solid rgba(246,232,195,.5)' }}
              >
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="type the secret word…"
                  disabled={submitted}
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none font-mono text-2xl text-white placeholder:text-white/20 pb-2 disabled:opacity-50"
                />
                {/* Blinking cursor */}
                {!submitted && (
                  <motion.span
                    className="w-[3px] h-8 bg-uc-gold flex-shrink-0"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.49, 0.5, 1] }}
                  />
                )}
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              onClick={handleGuess}
              disabled={submitted || !guess.trim()}
              whileHover={!submitted && guess.trim() ? { scale: 1.02 } : {}}
              whileTap={!submitted && guess.trim() ? { scale: 0.97 } : {}}
              className="font-heading text-xl tracking-widest px-10 py-4 rounded-lg border-2 border-double border-[#D83A3A] text-[#D83A3A] disabled:opacity-30 transition-all"
              style={{
                transform: 'rotate(-1deg)',
                boxShadow: guess.trim() && !submitted ? '0 0 26px rgba(216,58,58,.25)' : undefined,
              }}
            >
              {submitted ? 'SUBMITTED…' : 'SUBMIT GUESS'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="w-full text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.p
              className="font-heading text-xl text-white/60"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {mrwhitePlayer?.name ?? 'Mr. White'} is thinking…
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
