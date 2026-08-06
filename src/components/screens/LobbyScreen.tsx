import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { assignRoles, getWordForRole } from '../../lib/gameLogic'
import { getRandomWordPair } from '../../lib/wordPairs'
import AvatarBadge from '../ui/AvatarBadge'
import corkTexture from '../../assets/textures/cork.png'
import paperTexture from '../../assets/textures/paper.png'
import type { Player, LocalPlayerInfo, Room } from '../../types/game'

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

  return (
    <div className="min-h-screen flex items-center justify-center p-2">
      {/* Cork board with dark wood border */}
      <div
        className="relative w-full max-w-md rounded-md overflow-hidden"
        style={{
          border: '13px solid #3B2314',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Cork background */}
        <div
          className="relative p-5 pb-6"
          style={{
            backgroundImage: `url(${corkTexture})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        >
          {/* Red string decoration across top */}
          <div
            className="absolute top-6 left-0 right-0 h-px opacity-40"
            style={{ background: '#C0392B' }}
          />

          {/* Room code on sticky note */}
          <motion.div
            className="relative mx-auto w-fit mb-6"
            initial={{ scale: 0, rotate: -5 }}
            animate={{ scale: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Push pin */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                }}
              />
            </div>
            {/* Sticky note */}
            <div
              className="bg-uc-sticky px-8 py-4 text-center"
              style={{
                transform: 'rotate(-2deg)',
                boxShadow: '2px 3px 8px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <p className="text-xs font-body text-uc-ink-soft mb-1 tracking-wide uppercase">
                รหัสห้อง
              </p>
              <div className="text-4xl font-bold tracking-widest text-uc-ink font-mono">
                {room.room_code}
              </div>
            </div>
          </motion.div>

          {/* Copy link button */}
          <div className="flex justify-center mb-5">
            <button
              onClick={handleCopyLink}
              className="px-4 py-1.5 border border-uc-ink-soft text-uc-ink font-body text-xs rounded-sm
                         bg-uc-paper hover:bg-uc-paper-2 transition-colors shadow-sm"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: '150px 150px',
              }}
            >
              {copied ? '/ Copied /' : '/ Copy Link /'}
            </button>
          </div>

          {/* Player grid heading */}
          <div className="mb-3">
            <h3 className="font-heading text-uc-paper text-sm tracking-wide drop-shadow-sm">
              Suspects ({players.length})
            </h3>
          </div>

          {/* Player grid - 3 columns with pins */}
          <div className="flex flex-wrap gap-4 justify-center mb-6 max-h-52 overflow-y-auto px-1">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                className="flex flex-col items-center"
                style={{ width: 'calc(33.333% - 1rem)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 18,
                  delay: i * 0.06,
                }}
              >
                {/* Red pin dot */}
                <div
                  className="w-3 h-3 rounded-full mb-1 flex-shrink-0"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}
                />
                <AvatarBadge
                  name={p.name}
                  size="md"
                  textTheme="light"
                />
                {p.is_host && (
                  <span className="text-[10px] text-uc-gold font-mono mt-0.5">HOST</span>
                )}
                {p.id === localPlayer.id && (
                  <span className="text-[10px] text-uc-string font-mono">(you)</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Host settings panel */}
          {isHost && (
            <motion.div
              className="relative mb-5 p-4 rounded-sm"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px',
                backgroundColor: '#FAF6F0',
                boxShadow: '2px 3px 10px rgba(0,0,0,0.2)',
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Pin for settings card */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>

              <h3 className="font-heading text-uc-ink text-sm mb-3 text-center tracking-wide">
                Case Settings
              </h3>

              {/* Undercover count */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-body text-uc-ink-soft">Undercover</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUndercoverCount(Math.max(0, undercoverCount - 1))}
                    className="w-7 h-7 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper
                               text-uc-ink font-heading text-sm flex items-center justify-center
                               hover:bg-uc-paper-2 transition-colors"
                  >
                    -
                  </button>
                  <span
                    className="w-8 text-center font-heading text-uc-ink text-sm py-0.5 border-b border-dashed border-uc-ink-soft"
                  >
                    {undercoverCount}
                  </span>
                  <button
                    onClick={() => setUndercoverCount(Math.min(5, undercoverCount + 1))}
                    className="w-7 h-7 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper
                               text-uc-ink font-heading text-sm flex items-center justify-center
                               hover:bg-uc-paper-2 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mr. White count */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-body text-uc-ink-soft">Mr. White</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMrwhiteCount(Math.max(0, mrwhiteCount - 1))}
                    className="w-7 h-7 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper
                               text-uc-ink font-heading text-sm flex items-center justify-center
                               hover:bg-uc-paper-2 transition-colors"
                  >
                    -
                  </button>
                  <span
                    className="w-8 text-center font-heading text-uc-ink text-sm py-0.5 border-b border-dashed border-uc-ink-soft"
                  >
                    {mrwhiteCount}
                  </span>
                  <button
                    onClick={() => setMrwhiteCount(Math.min(3, mrwhiteCount + 1))}
                    className="w-7 h-7 rounded-full border border-dashed border-uc-ink-soft bg-uc-paper
                               text-uc-ink font-heading text-sm flex items-center justify-center
                               hover:bg-uc-paper-2 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* Start game / waiting message */}
          {isHost ? (
            <motion.button
              onClick={handleStart}
              disabled={starting || players.length < 3}
              className="w-full py-3.5 font-heading text-lg tracking-wide text-uc-ink
                         rounded-sm transition-all disabled:opacity-40
                         shadow-uc-paper-lifted hover:shadow-uc-paper active:translate-y-0.5"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px',
                backgroundColor: '#FAF6F0',
                border: '2px solid',
                borderColor: '#D4A843',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {starting ? 'Opening Case...' : 'Start Game'}
            </motion.button>
          ) : (
            <motion.div
              className="relative text-center py-4 px-6 mx-auto w-fit"
              style={{
                backgroundImage: `url(${paperTexture})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px',
                backgroundColor: '#FAF6F0',
                transform: 'rotate(1deg)',
                boxShadow: '2px 3px 8px rgba(0,0,0,0.2)',
              }}
              initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 1, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Pin */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #FF6B6B, #C0392B)',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <p className="font-body text-uc-ink-soft text-sm italic">
                Waiting for Host...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
