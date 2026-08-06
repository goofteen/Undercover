import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlass, PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import { getDescriptionOrder, getWordForRole } from '../../lib/gameLogic'
import AvatarBadge from '../ui/AvatarBadge'
import paperTexture from '../../assets/textures/paper.png'
import darkWallTexture from '../../assets/textures/dark-wall.png'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function DescriptionScreen({ room, players, gameState, localPlayer }: Props) {
  const [hint, setHint] = useState('')
  // optimistic: track submitted hint locally so UI updates instantly on press
  const [localHint, setLocalHint] = useState<string | null>(null)

  const order = getDescriptionOrder(players)
  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const myRole = myPlayer?.role ?? null
  const myWord = myRole && room.word_pair ? getWordForRole(myRole, room.word_pair) : null
  const isHost = myPlayer?.is_host

  const descriptions = gameState.descriptions ?? {}
  // show as submitted if either DB confirmed it or we optimistically submitted
  const myConfirmedHint = descriptions[localPlayer.id] ?? localHint
  const hasMyHint = !!myConfirmedHint

  const submittedCount = order.filter((p) => !!descriptions[p.id]).length

  async function handleSubmitHint() {
    const trimmed = hint.trim()
    if (!trimmed || hasMyHint) return
    // optimistic: hide input immediately
    setLocalHint(trimmed)
    setHint('')
    const newDescriptions = { ...descriptions, [localPlayer.id]: trimmed }
    const { error } = await supabase.from('game_state').update({
      descriptions: newDescriptions,
    }).eq('room_code', room.room_code)
    if (error) {
      // rollback on failure
      setLocalHint(null)
      setHint(trimmed)
    }
  }

  async function handleNext() {
    await supabase.from('game_state').update({
      phase: 'voting',
      votes: {},
    }).eq('room_code', room.room_code)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `url(${darkWallTexture}) center/cover`, backgroundColor: '#0d0d1a' }}
    >
      {/* Spotlight */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 300px 400px at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 70%)',
      }} />

      <div className="w-full max-w-lg relative z-10">

        {/* Header */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-flex items-center gap-2 bg-uc-surface border border-white/10 text-uc-gold font-mono text-sm px-4 py-1.5 rounded-full">
            <MagnifyingGlass size={14} weight="fill" />
            รอบที่ {gameState.round} — ใบ้คำพร้อมกัน
          </span>
          <p className="text-white/40 text-xs font-mono mt-2">
            {submittedCount}/{order.length} คนส่งคำใบ้แล้ว
          </p>
        </motion.div>

        {/* My word reminder */}
        {myWord ? (
          <motion.div
            className="rounded-uc-2 px-4 py-3 mb-4 flex items-center gap-3 shadow-uc-paper"
            style={{ backgroundImage: `url(${paperTexture})`, backgroundSize: 'cover' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MagnifyingGlass size={20} className="text-uc-gold flex-shrink-0" weight="fill" />
            <div>
              <p className="text-xs text-uc-ink-soft font-mono uppercase tracking-wider">คำลับของคุณ</p>
              <p className="font-heading text-lg text-uc-ink">{myWord}</p>
            </div>
          </motion.div>
        ) : myRole === 'mrwhite' ? (
          <motion.div
            className="bg-uc-surface border border-white/10 rounded-uc-2 px-4 py-3 mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs text-white/50 font-mono">คุณคือ Mr. White — ไม่มีคำลับ แอบอ่านให้ดี!</p>
          </motion.div>
        ) : null}

        {/* Hint input */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {!hasMyHint ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitHint()}
                  placeholder="พิมพ์คำใบ้ของคุณ..."
                  disabled={false}
                  maxLength={50}
                  autoFocus
                  className="flex-1 bg-uc-surface border-2 border-uc-gold/30 rounded-uc-2 px-4 py-3 text-white font-body placeholder:text-white/30 focus:border-uc-gold focus:outline-none disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleSubmitHint}
                  disabled={!hint.trim()}
                  className="px-4 py-3 bg-uc-gold text-uc-ink rounded-uc-2 font-heading hover:brightness-110 active:scale-[0.98] transition disabled:opacity-40"
                >
                  <PaperPlaneTilt size={20} weight="fill" />
                </button>
              </div>
              <p className="text-white/30 text-xs mt-2 font-mono">
                ใบ้แบบอ้อมๆ — ห้ามพูดคำลับตรงๆ
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-uc-success/10 border border-uc-success/30 rounded-uc-2">
              <CheckCircle size={18} weight="fill" className="text-uc-success flex-shrink-0" />
              <span className="text-uc-success text-sm font-mono">
                ส่งแล้ว: "{myConfirmedHint}"
              </span>
            </div>
          )}
        </motion.div>

        {/* All players — hint list */}
        <motion.div
          className="mb-5 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-3">คำใบ้ทั้งหมด</p>
          {order.map((p, i) => {
            const theirHint = descriptions[p.id]
            const isMe = p.id === localPlayer.id
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={`rounded-uc px-3 py-2.5 flex items-center gap-3 ${
                  theirHint
                    ? 'shadow-uc-soft'
                    : 'border border-white/5 bg-white/5'
                }`}
                style={theirHint ? {
                  backgroundImage: `url(${paperTexture})`,
                  backgroundSize: 'cover',
                } : undefined}
              >
                <AvatarBadge
                  name={p.name}
                  size="sm"
                  textTheme={theirHint ? 'light' : 'dark'}
                />
                {theirHint ? (
                  <span className="font-body text-uc-ink text-sm flex-1">
                    "{theirHint}"
                    {isMe && <span className="text-xs text-uc-ink-soft ml-1">(คุณ)</span>}
                  </span>
                ) : (
                  <span className="text-white/30 text-sm font-mono italic flex-1">
                    รอ...
                    {isMe && <span className="text-white/50 not-italic"> (คุณ)</span>}
                  </span>
                )}
                {theirHint && (
                  <CheckCircle size={14} weight="fill" className="text-uc-success flex-shrink-0" />
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Host next button */}
        {isHost && (
          <motion.button
            onClick={handleNext}
            className="w-full py-4 bg-uc-paper text-uc-ink font-heading text-lg rounded-[0_12px_12px_12px] shadow-uc-paper hover:brightness-95 active:scale-[0.98] transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            ไปโหวตได้เลย →
          </motion.button>
        )}
        {!isHost && (
          <motion.p
            className="text-center text-white/30 text-sm font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            รอ Host กดถัดไป...
          </motion.p>
        )}
      </div>
    </div>
  )
}
