import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { assignRoles, getWordForRole } from '../../lib/gameLogic'
import { getRandomWordPair } from '../../lib/wordPairs'
import corkTexture from '../../assets/textures/cork.png'
import paperTexture from '../../assets/textures/paper.png'
import { getAvatar } from '../../lib/avatars'
import type { Player, LocalPlayerInfo, Room } from '../../types/game'

const CARD_ROTATIONS = [-3, 2, -1, 3, -2, 1, -3, 2, -1, 3, -2, 1]

function PolaroidCard({ p, localPlayer, index }: { p: Player; localPlayer: LocalPlayerInfo; index: number }) {
  const rotate = CARD_ROTATIONS[index % CARD_ROTATIONS.length]
  const isMe = p.id === localPlayer.id
  const avatar = getAvatar(p.name)

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0, rotate: rotate * 2 }}
      animate={{ scale: 1, rotate }}
      transition={{ type: 'spring', stiffness: 320, damping: 20, delay: index * 0.06 }}
    >
      <div className="relative">
        {/* Red push pin */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
          }}
        />
        {/* Polaroid frame */}
        <div
          className="bg-white pt-2 px-2 pb-6"
          style={{ boxShadow: '2px 5px 14px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {/* Photo area */}
          <div className="w-14 h-14 overflow-hidden">
            <img src={avatar} alt={p.name} className="w-full h-full object-cover" />
          </div>
          {/* Caption strip */}
          <div className="absolute bottom-1.5 left-0 right-0 flex flex-col items-center gap-0.5 px-1">
            <span className="text-[9px] font-mono text-[#2E2618] font-semibold truncate max-w-[56px] leading-none">
              {p.name}
            </span>
            <div className="flex gap-1">
              {p.is_host && (
                <span className="text-[7px] font-mono px-1 rounded bg-[#2E2618] text-[#D4AF37] leading-tight">
                  HOST
                </span>
              )}
              {isMe && (
                <span className="text-[7px] font-mono px-1 rounded bg-[#2E2618] text-white leading-tight">
                  you
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface Props {
  room: Room
  players: Player[]
  localPlayer: LocalPlayerInfo
  onRoleAssigned: (role: LocalPlayerInfo['role'], word: string | null) => void
}

export default function LobbyScreen({ room, players, localPlayer, onRoleAssigned }: Props) {
  const [undercoverCount, setUndercoverCount] = useState(room.undercover_count)
  const [mrwhiteCount, setMrwhiteCount] = useState(room.mrwhite_count)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  const isHost = localPlayer.id === room.host_player_id
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.room_code}`

  async function handleStart() {
    if (players.length < 3) { alert('ต้องมีผู้เล่นอย่างน้อย 3 คน'); return }
    const totalImpostors = undercoverCount + mrwhiteCount
    if (totalImpostors >= players.length - 1) { alert('จำนวนสายลับมากเกินไป'); return }
    setStarting(true)

    const wordPair = getRandomWordPair()
    const assignments = assignRoles(players, undercoverCount, mrwhiteCount)

    // Update player roles + room settings + reveal phase all in parallel
    await Promise.all([
      ...assignments.map((a) =>
        supabase.from('players').update({ role: a.role }).eq('id', a.playerId)
      ),
      supabase.from('rooms').update({
        status: 'playing',
        undercover_count: undercoverCount,
        mrwhite_count: mrwhiteCount,
        word_pair: wordPair,
        host_player_id: room.host_player_id,
      }).eq('room_code', room.room_code),
      supabase.from('game_state').update({ phase: 'reveal' }).eq('room_code', room.room_code),
    ])

    // Set local player's own role/word
    const myAssignment = assignments.find((a) => a.playerId === localPlayer.id)
    if (myAssignment) {
      onRoleAssigned(myAssignment.role, getWordForRole(myAssignment.role, wordPair))
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colCount = players.length >= 10 ? 5 : players.length >= 7 ? 4 : 3
  const colPct = `calc(${100 / colCount}% - 1.25rem)`

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      {/* Cork board frame */}
      <div
        className="relative w-full max-w-3xl rounded-md overflow-hidden"
        style={{
          border: '13px solid #3B2314',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Cork background — two-column flex */}
        <div
          className="flex flex-col sm:flex-row"
          style={{
            backgroundImage: `url(${corkTexture})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        >
          {/* ── LEFT PANEL: player board ── */}
          <div className="flex-1 p-5 min-h-64">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-heading text-uc-paper text-xl tracking-wide drop-shadow">
                Case Lobby
              </h2>
              <span className="font-mono text-xs text-uc-paper/60 drop-shadow">
                {players.length} AGENT{players.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {/* Polaroid grid */}
            <div className="flex flex-wrap gap-5 justify-start pt-3 pb-2">
              {players.map((p, i) => (
                <div key={p.id} style={{ width: colPct }}>
                  <PolaroidCard p={p} localPlayer={localPlayer} index={i} />
                </div>
              ))}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div
            className="hidden sm:block w-px"
            style={{ borderLeft: '2px dashed rgba(59,35,20,0.35)' }}
          />

          {/* ── RIGHT PANEL: room code + settings ── */}
          <div className="w-full sm:w-56 p-4 flex flex-col gap-4">

            {/* Room code sticky */}
            <motion.div
              className="relative mx-auto"
              style={{ transform: 'rotate(2deg)' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Pin */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 w-4 h-4 rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)', boxShadow: '0 2px 4px rgba(0,0,0,0.45)' }}
              />
              <div
                className="px-5 py-3 text-center w-full"
                style={{ backgroundColor: '#F5E642', boxShadow: '2px 4px 10px rgba(0,0,0,0.3)' }}
              >
                <p className="text-[9px] font-mono text-[#5a5000] uppercase tracking-widest mb-0.5">Room Code</p>
                <div className="text-3xl font-bold tracking-widest text-[#1a1800] font-mono">
                  {room.room_code}
                </div>
              </div>
            </motion.div>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="text-[10px] font-mono text-uc-ink/50 hover:text-uc-ink transition-colors underline text-center -mt-2"
            >
              {copied ? '✓ Copied!' : 'Copy invite link'}
            </button>

            {/* Case Settings (host only) */}
            {isHost ? (
              <motion.div
                className="relative p-3 rounded-sm flex-1"
                style={{
                  backgroundImage: `url(${paperTexture})`,
                  backgroundSize: '150px',
                  backgroundColor: '#FAF6F0',
                  boxShadow: '2px 3px 8px rgba(0,0,0,0.22)',
                }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-3.5 h-3.5 rounded-full"
                  style={{ background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)', boxShadow: '0 2px 3px rgba(0,0,0,0.3)' }}
                />
                <h3 className="font-heading text-uc-ink text-xs mb-3 text-center tracking-widest uppercase">
                  Case Settings
                </h3>

                {/* Undercover */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-body text-uc-ink-soft">Undercover</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setUndercoverCount(Math.max(0, undercoverCount - 1))}
                      className="w-6 h-6 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper text-uc-ink text-xs flex items-center justify-center hover:bg-uc-paper-2 transition-colors">
                      -
                    </button>
                    <span className="w-5 text-center font-heading text-uc-ink text-sm">{undercoverCount}</span>
                    <button onClick={() => setUndercoverCount(Math.min(5, undercoverCount + 1))}
                      className="w-6 h-6 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper text-uc-ink text-xs flex items-center justify-center hover:bg-uc-paper-2 transition-colors">
                      +
                    </button>
                  </div>
                </div>

                {/* Mr. White */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-body text-uc-ink-soft">Mr. White</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setMrwhiteCount(Math.max(0, mrwhiteCount - 1))}
                      className="w-6 h-6 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper text-uc-ink text-xs flex items-center justify-center hover:bg-uc-paper-2 transition-colors">
                      -
                    </button>
                    <span className="w-5 text-center font-heading text-uc-ink text-sm">{mrwhiteCount}</span>
                    <button onClick={() => setMrwhiteCount(Math.min(3, mrwhiteCount + 1))}
                      className="w-6 h-6 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper text-uc-ink text-xs flex items-center justify-center hover:bg-uc-paper-2 transition-colors">
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Start / waiting */}
            {isHost ? (
              <motion.button
                onClick={handleStart}
                disabled={starting || players.length < 3}
                className="w-full py-3 font-heading text-sm tracking-wide text-uc-ink rounded-sm disabled:opacity-40 transition-all"
                style={{
                  backgroundImage: `url(${paperTexture})`,
                  backgroundSize: '150px',
                  backgroundColor: '#FAF6F0',
                  border: '2px solid #D4A843',
                  boxShadow: '2px 4px 10px rgba(0,0,0,0.25)',
                }}
                whileHover={{ scale: 1.02, boxShadow: '2px 6px 16px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.97 }}
              >
                {starting ? 'Opening Case...' : 'Start Investigation'}
              </motion.button>
            ) : (
              <p className="text-center text-uc-paper/50 text-[11px] font-mono italic pb-1">
                Waiting for host...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
