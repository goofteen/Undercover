import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { LocalPlayerInfo, Player, Room } from '../../types/game'
import { getWordForRole } from '../../lib/gameLogic'
import SecretCard from '../ui/SecretCard'

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
    // If host, check if we can proceed (simplified: host controls transition)
    // For now, host advances after seeing their word
    if (myPlayer?.is_host) {
      await supabase.from('game_state').update({
        phase: 'description',
        current_player_index: 0,
      }).eq('room_code', room.room_code)
    }
    onReady()
  }

  return (
    <div className="min-h-screen bg-uc-bg flex flex-col items-center justify-center p-4">
      {/* Title */}
      <motion.h2
        className="font-heading text-uc-gold text-2xl mb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        เอกสารลับ
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="text-uc-text-secondary text-sm mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        อย่าให้คนอื่นเห็น!
      </motion.p>

      {/* Secret Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SecretCard
          word={word}
          isMrWhite={role === 'mrwhite'}
          onRevealed={() => setRevealed(true)}
        />
      </motion.div>

      {/* Ready button — only after card is flipped */}
      {revealed && (
        <motion.div
          className="mt-8 w-72"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {!ready ? (
            <button
              onClick={handleReady}
              className="w-full py-4 bg-uc-paper text-uc-ink font-heading text-lg rounded-xl shadow-lg hover:brightness-95 active:scale-[0.98] transition"
            >
              {myPlayer?.is_host ? 'เริ่มเกมได้เลย →' : 'พร้อมแล้ว ✓'}
            </button>
          ) : (
            <p className="text-uc-text-secondary text-center text-sm">
              {myPlayer?.is_host ? 'กำลังเริ่ม...' : 'รอ Host เริ่มรอบ...'}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
