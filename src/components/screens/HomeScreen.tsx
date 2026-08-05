import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { generateRoomCode } from '../../lib/roomCode'
import type { LocalPlayerInfo } from '../../types/game'

interface Props {
  onJoined: (info: LocalPlayerInfo) => void
}

export default function HomeScreen({ onJoined }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill room code from URL param
  const urlCode = new URLSearchParams(window.location.search).get('room')
  if (urlCode && !roomCodeInput && mode === 'home') {
    setRoomCodeInput(urlCode.toUpperCase())
    setMode('join')
  }

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
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🕵️</div>
          <h1 className="text-4xl font-bold text-gray-800">Undercover</h1>
          <p className="text-gray-500 mt-1">เกมจับสายลับ</p>
        </div>

        {mode === 'home' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl transition shadow-lg"
            >
              สร้างห้องใหม่
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white text-lg font-semibold rounded-2xl transition shadow-lg"
            >
              เข้าร่วมห้อง
            </button>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อของคุณ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ใส่ชื่อ..."
                maxLength={20}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
                autoFocus
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสห้อง</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="เช่น ABCD12"
                  maxLength={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-mono tracking-widest focus:border-pink-400 focus:outline-none"
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
              className={`w-full py-4 text-white text-lg font-semibold rounded-2xl transition shadow-lg ${
                mode === 'create'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-teal-500 hover:bg-teal-600'
              } disabled:opacity-50`}
            >
              {loading ? 'กำลังโหลด...' : mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วม'}
            </button>
            <button
              onClick={() => { setMode('home'); setError('') }}
              className="w-full py-2 text-gray-500 hover:text-gray-700 transition"
            >
              ← ย้อนกลับ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
