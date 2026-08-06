import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { generateRoomCode } from '../../lib/roomCode'
import type { LocalPlayerInfo } from '../../types/game'
import paperTexture from '../../assets/textures/paper.png'

interface Props {
  onJoined: (info: LocalPlayerInfo) => void
}

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.7, 0.35, 1] as const } },
}

export default function HomeScreen({ onJoined }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill room code from URL param
  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get('room')
    if (urlCode && mode === 'home') {
      setRoomCodeInput(urlCode.toUpperCase())
      setMode('join')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!name.trim()) { setError('กรุณาใส่ชื่อ'); return }
    setLoading(true)
    setError('')
    const roomCode = generateRoomCode()

    // Create room
    const { error: roomErr } = await supabase.from('rooms').insert({
      room_code: roomCode,
      status: 'lobby',
      undercover_count: 1,
      mrwhite_count: 0,
      turn_time_sec: 60,
    })
    if (roomErr) { setError('สร้างห้องไม่สำเร็จ'); setLoading(false); return }

    // Create host player
    const { data: player, error: playerErr } = await supabase.from('players').insert({
      room_code: roomCode,
      name: name.trim(),
      is_host: true,
      join_order: 0,
    }).select().single()
    if (playerErr) { setError('เกิดข้อผิดพลาด'); setLoading(false); return }

    // Update room with host_player_id
    await supabase.from('rooms').update({ host_player_id: player.id }).eq('room_code', roomCode)

    // Create initial game_state row
    await supabase.from('game_state').insert({ room_code: roomCode, phase: 'lobby' })

    onJoined({ id: player.id, name: name.trim(), room_code: roomCode, role: null, word: null })
    setLoading(false)
  }

  async function handleJoin() {
    if (!name.trim()) { setError('กรุณาใส่ชื่อ'); return }
    const code = roomCodeInput.trim().toUpperCase()
    if (!code) { setError('กรุณาใส่รหัสห้อง'); return }
    setLoading(true)
    setError('')

    // Check room exists and is in lobby
    const { data: room, error: roomErr } = await supabase.from('rooms').select('*').eq('room_code', code).single()
    if (roomErr || !room) { setError('ไม่พบห้องนี้'); setLoading(false); return }
    if (room.status !== 'lobby') { setError('เกมนี้เริ่มไปแล้ว'); setLoading(false); return }

    // Check if same name already exists in room
    const { data: existing } = await supabase.from('players').select('*').eq('room_code', code).eq('name', name.trim()).single()
    if (existing) {
      // Rejoin as existing player
      onJoined({ id: existing.id, name: existing.name, room_code: code, role: null, word: null })
      setLoading(false)
      return
    }

    // Get current player count for join_order
    const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('room_code', code)

    const { data: player, error: playerErr } = await supabase.from('players').insert({
      room_code: code,
      name: name.trim(),
      is_host: false,
      join_order: count ?? 1,
    }).select().single()
    if (playerErr) { setError('เข้าร่วมไม่สำเร็จ'); setLoading(false); return }

    onJoined({ id: player.id, name: name.trim(), room_code: code, role: null, word: null })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-uc-bg flex items-center justify-center p-4">
      {/* Case folder card */}
      <motion.div
        className="relative w-full max-w-md shadow-uc-paper"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Folder tab */}
        <motion.div variants={fadeUp} className="ml-6 inline-block mb-[-1px] relative z-[1]">
          <div className="bg-uc-paper px-6 py-1.5 pb-2 rounded-t-uc font-heading text-uc-ink-soft text-sm tracking-wider">
            CASE FILE
          </div>
        </motion.div>

        {/* Main card body */}
        <div
          className="relative bg-uc-paper rounded-[0_8px_8px_8px] overflow-hidden"
          style={{
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: 'cover',
          }}
        >
          {/* CLASSIFIED tape decoration */}
          <div className="absolute -right-8 top-6 z-10 rotate-[30deg]">
            <div
              className="px-8 py-1 text-xs font-heading tracking-[0.3em] text-white/90 uppercase"
              style={{
                background: 'repeating-linear-gradient(45deg, #D83A3A, #D83A3A 4px, #B22E2E 4px, #B22E2E 8px)',
              }}
            >
              CLASSIFIED
            </div>
          </div>

          <div className="relative p-8 pt-6">
            {/* Logo */}
            <motion.div variants={fadeUp} className="text-center mb-8">
              <div className="text-5xl mb-3">
                <span role="img" aria-label="detective">🕵️</span>
              </div>
              <h1 className="text-3xl font-heading text-uc-gold tracking-wider">
                UNDERCOVER
              </h1>
              <p className="text-uc-ink-soft font-body text-sm mt-1.5">
                เกมจับสายลับ
              </p>
              {/* Decorative line */}
              <div className="mt-3 mx-auto w-24 border-t border-dashed border-uc-ink-soft/40" />
            </motion.div>

            {mode === 'home' && (
              <motion.div
                className="space-y-3"
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                <motion.button
                  variants={fadeUp}
                  onClick={() => setMode('create')}
                  className="w-full py-3.5 bg-uc-paper-2 hover:bg-uc-paper-shadow text-uc-ink font-heading text-lg tracking-wide rounded-[0_8px_8px_8px] transition shadow-uc-soft border border-uc-ink/10 active:scale-[0.98]"
                >
                  สร้างห้องใหม่
                </motion.button>
                <motion.button
                  variants={fadeUp}
                  onClick={() => setMode('join')}
                  className="w-full py-3.5 bg-transparent hover:bg-uc-ink/5 text-uc-ink font-heading text-lg tracking-wide rounded-[0_8px_8px_8px] transition border-2 border-dashed border-uc-ink/30 active:scale-[0.98]"
                >
                  เข้าร่วมห้อง
                </motion.button>
              </motion.div>
            )}

            {(mode === 'create' || mode === 'join') && (
              <motion.div
                className="space-y-5"
                variants={stagger}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={fadeUp}>
                  <label className="block text-xs font-heading text-uc-ink-soft tracking-wider uppercase mb-2">
                    ชื่อของคุณ
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ใส่ชื่อ..."
                    maxLength={20}
                    className="w-full bg-transparent border-b-2 border-dashed border-uc-ink/30 px-1 py-2.5 text-lg font-mono text-uc-ink placeholder:text-uc-ink-soft/50 focus:border-uc-gold focus:outline-none transition-colors"
                    autoFocus
                  />
                </motion.div>

                {mode === 'join' && (
                  <motion.div variants={fadeUp}>
                    <label className="block text-xs font-heading text-uc-ink-soft tracking-wider uppercase mb-2">
                      รหัสห้อง
                    </label>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="ABCD12"
                      maxLength={6}
                      className="w-full bg-transparent border-b-2 border-dashed border-uc-ink/30 px-1 py-2.5 text-xl font-mono tracking-[0.3em] text-uc-ink placeholder:text-uc-ink-soft/50 focus:border-uc-gold focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}

                {error && (
                  <motion.p
                    variants={fadeUp}
                    className="text-uc-danger text-sm font-body flex items-center gap-1.5"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-uc-danger" />
                    {error}
                  </motion.p>
                )}

                <motion.button
                  variants={fadeUp}
                  onClick={mode === 'create' ? handleCreate : handleJoin}
                  disabled={loading}
                  className={`w-full py-3.5 font-heading text-lg tracking-wide rounded-[0_8px_8px_8px] transition shadow-uc-soft active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
                    mode === 'create'
                      ? 'bg-uc-paper-2 hover:bg-uc-paper-shadow text-uc-ink border border-uc-ink/10'
                      : 'bg-uc-gold/90 hover:bg-uc-gold text-uc-ink border border-uc-gold-dark/30'
                  }`}
                >
                  {loading ? 'กำลังโหลด...' : mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วม'}
                </motion.button>
                <motion.button
                  variants={fadeUp}
                  onClick={() => { setMode('home'); setError('') }}
                  className="w-full py-2 text-uc-ink-soft hover:text-uc-ink font-body text-sm transition"
                >
                  &#8592; ย้อนกลับ
                </motion.button>
              </motion.div>
            )}
          </div>

        </div>

        {/* Wax seal decoration — outside overflow-hidden card */}
        <motion.div
          variants={fadeUp}
          className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full flex items-center justify-center shadow-uc-large z-20"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #E74C3C 0%, #C0392B 50%, #96281B 100%)',
          }}
        >
          <span className="font-heading text-white/90 text-xl mt-[-1px]">U</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
