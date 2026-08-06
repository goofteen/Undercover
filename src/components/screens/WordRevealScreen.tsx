import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { LocalPlayerInfo, Player, Room } from '../../types/game'
import { getWordForRole } from '../../lib/gameLogic'
import SecretCard from '../ui/SecretCard'
import noiseTexture from '../../assets/textures/noise.png'
import paperTexture from '../../assets/textures/paper.png'

interface Props {
  room: Room
  players: Player[]
  localPlayer: LocalPlayerInfo
  onReady: () => void
}

export default function WordRevealScreen({ room, players, localPlayer, onReady }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [ready, setReady] = useState(false)

  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const role = myPlayer?.role ?? null
  const word = role && room.word_pair ? getWordForRole(role, room.word_pair) : null

  async function handleReady() {
    setReady(true)
    if (myPlayer?.is_host) {
      await supabase.from('game_state').update({
        phase: 'description',
        current_player_index: 0,
      }).eq('room_code', room.room_code)
    }
    onReady()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#12121F' }}
    >
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 50% 46%, rgba(246,232,195,.09), transparent 55%)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-sm">
        {/* Heading */}
        <motion.h2
          className="font-heading text-2xl text-white tracking-wide text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Your secret assignment
        </motion.h2>

        {/* Flip card */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SecretCard
            word={word}
            isMrWhite={role === 'mrwhite'}
            onRevealed={() => setRevealed(true)}
          />
        </motion.div>

        {/* Action after reveal */}
        {revealed && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {!ready ? (
              <motion.button
                onClick={handleReady}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 font-heading text-lg tracking-wide text-[#2E2618] relative overflow-visible"
                style={{
                  backgroundImage: `url(${paperTexture})`,
                  backgroundColor: '#F6E8C3',
                  borderRadius: '0 8px 8px 8px',
                  boxShadow: '0 3px 10px rgba(20,16,4,.28)',
                }}
              >
                {myPlayer?.is_host ? 'Start round →' : 'Ready ✓'}
              </motion.button>
            ) : (
              <p className="text-center font-mono text-sm text-white/40">
                {myPlayer?.is_host ? 'Starting…' : 'Waiting for host…'}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
