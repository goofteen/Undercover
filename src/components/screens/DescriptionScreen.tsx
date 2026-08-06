import { useState } from 'react'
import { motion } from 'framer-motion'
import { PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'
import { getDescriptionOrder, getWordForRole } from '../../lib/gameLogic'
import paperTexture from '../../assets/textures/paper.png'
import noiseTexture from '../../assets/textures/noise.png'
import { getAvatar } from '../../lib/avatars'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function DescriptionScreen({ room, players, gameState, localPlayer }: Props) {
  const [hint, setHint] = useState('')
  const [localHint, setLocalHint] = useState<string | null>(null)

  const order = getDescriptionOrder(players)
  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const myRole = myPlayer?.role ?? null
  const myWord = myRole && room.word_pair ? getWordForRole(myRole, room.word_pair) : null
  const isHost = myPlayer?.is_host

  const descriptions = gameState.descriptions ?? {}
  const myConfirmedHint = descriptions[localPlayer.id] ?? localHint
  const hasMyHint = !!myConfirmedHint

  const submittedCount = order.filter((p) => !!descriptions[p.id]).length

  async function handleSubmitHint() {
    const trimmed = hint.trim()
    if (!trimmed || hasMyHint) return
    setLocalHint(trimmed)
    setHint('')
    const newDescriptions = { ...descriptions, [localPlayer.id]: trimmed }
    const { error } = await supabase.from('game_state').update({
      descriptions: newDescriptions,
    }).eq('room_code', room.room_code)
    if (error) {
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
    <div className="min-h-screen flex flex-col bg-[#0E0E1A] relative overflow-hidden">
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundSize: '200px', opacity: 0.5 }}
      />

      {/* Spotlight glow from top */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 340px 400px at 50% 38%, rgba(246,232,195,.14), transparent 68%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 pt-8 pb-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-heading text-2xl text-white tracking-wide">
              Round {gameState.round} · Descriptions
            </h2>
            <p className="font-mono text-sm text-[#B9BEC8] mt-0.5">
              Describe your word. Don't give it away.
            </p>
          </div>
          <span className="font-mono text-xs text-uc-gold border border-uc-gold/50 rounded-full px-3 py-1 tracking-wide flex-shrink-0 ml-3">
            {submittedCount}/{order.length}
          </span>
        </div>

        {/* My word card — paper texture spotlight card */}
        {myWord ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundSize: '200px',
              backgroundColor: '#F6E8C3',
              boxShadow: '0 0 0 2px rgba(212,175,55,.35), 0 0 34px rgba(212,175,55,.18), 0 8px 24px rgba(0,0,0,.4)',
              transform: 'rotate(-0.5deg)',
            }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#16213E' }}
            >
              <span className="font-heading text-xl font-bold" style={{ color: '#D4AF37' }}>
                {myWord.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#6B5D3F] tracking-[.2em]">YOUR SECRET WORD</p>
              <p className="font-heading text-2xl text-[#2E2618]">{myWord}</p>
            </div>
            <div className="ml-auto font-mono text-[9px] tracking-wider text-white bg-[#D83A3A] rounded px-2 py-1">
              {myRole === 'civilian' ? 'CIVILIAN' : 'UNDERCOVER'}
            </div>
          </motion.div>
        ) : myRole === 'mrwhite' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-3 border border-white/10 rounded-lg"
            style={{ backgroundColor: 'rgba(22,33,62,.8)' }}
          >
            <p className="font-mono text-xs text-white/50 tracking-wide">
              You are MR. WHITE — no secret word. Listen carefully and blend in.
            </p>
          </motion.div>
        ) : null}

        {/* Hint input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {!hasMyHint ? (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-[#B9BEC8] tracking-[.18em]">
                STATEMENT ON RECORD
              </label>
              <div
                className="flex items-center gap-2"
                style={{ borderBottom: '2px solid rgba(246,232,195,.3)' }}
              >
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitHint()}
                  placeholder="Describe your word…"
                  maxLength={60}
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none font-mono text-lg text-white placeholder:text-white/20 pb-2"
                />
                <button
                  onClick={handleSubmitHint}
                  disabled={!hint.trim()}
                  className="pb-2 text-uc-gold disabled:text-white/20 transition-colors"
                >
                  <PaperPlaneTilt size={22} weight="fill" />
                </button>
              </div>
              <p className="font-mono text-[10px] text-white/30">
                Be indirect — don't say the word directly
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 px-4 py-4 rounded-lg relative overflow-hidden"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: '200px',
                backgroundColor: '#F6E8C3',
                boxShadow: '0 10px 28px rgba(20,16,4,.35)',
                transform: 'rotate(0.5deg)',
              }}
            >
              <CheckCircle size={22} weight="fill" className="text-[#2ECC71] flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[10px] text-[#6B5D3F] tracking-[.2em]">STATEMENT ON RECORD</p>
                <p className="font-heading text-xl text-[#2E2618] leading-snug">
                  "{myConfirmedHint}"
                </p>
              </div>
              {/* Corner fold */}
              <div
                className="absolute right-0 bottom-0 w-0 h-0"
                style={{ borderLeft: '22px solid transparent', borderBottom: '22px solid #E3CE97', borderRadius: '0 0 8px 0' }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* All players hint list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase mb-3">
            All statements
          </p>
          <div className="space-y-2">
            {order.map((p, i) => {
              const theirHint = descriptions[p.id]
              const isMe = p.id === localPlayer.id
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={theirHint ? {
                    backgroundImage: `url(${paperTexture})`,
                    backgroundSize: '150px',
                    backgroundColor: '#F6E8C3',
                    boxShadow: '0 2px 8px rgba(20,16,4,.25)',
                  } : {
                    backgroundColor: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  {/* Mini avatar */}
                  <div
                    className="w-8 h-8 overflow-hidden flex-shrink-0"
                    style={{ outline: theirHint ? 'none' : '1px solid rgba(255,255,255,.1)' }}
                  >
                    <img src={getAvatar(p.name)} alt={p.name} className="w-full h-full object-cover" />
                  </div>

                  {theirHint ? (
                    <span className="font-heading text-sm text-[#2E2618] flex-1">
                      "{theirHint}"
                      {isMe && <span className="font-mono text-[9px] text-[#6B5D3F] ml-1">(you)</span>}
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-white/30 italic flex-1">
                      {isMe ? 'Type your statement above…' : `${p.name} is typing…`}
                    </span>
                  )}

                  {theirHint && (
                    <CheckCircle size={14} weight="fill" className="text-[#2ECC71] flex-shrink-0" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Host → next */}
        {isHost ? (
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 font-heading text-lg tracking-wide text-[#2E2618] relative overflow-visible mt-2"
            style={{
              backgroundImage: `url(${paperTexture})`,
              backgroundColor: '#F6E8C3',
              borderRadius: '0 8px 8px 8px',
              boxShadow: '0 3px 10px rgba(20,16,4,.28)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span
              className="absolute -top-3 left-0 w-16 h-3 rounded-t-lg"
              style={{ backgroundImage: `url(${paperTexture})`, backgroundColor: '#F6E8C3' }}
            />
            Go to voting →
          </motion.button>
        ) : (
          <motion.p
            className="text-center font-mono text-sm text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Waiting for host…
          </motion.p>
        )}
      </div>
    </div>
  )
}
