import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { assignRoles, getWordForRole } from '../../lib/gameLogic'
import { getRandomWordPair } from '../../lib/wordPairs'
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
  const [turnTimeSec, setTurnTimeSec] = useState(room.turn_time_sec ?? 60)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  const isHost = localPlayer.id === room.host_player_id
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.room_code}`
  const maxImpostors = Math.max(0, players.length - 2) // need at least 2 civilians

  async function handleStart() {
    if (players.length < 3) { alert('ต้องมีผู้เล่นอย่างน้อย 3 คน'); return }
    const totalImpostors = undercoverCount + mrwhiteCount
    if (totalImpostors >= players.length - 1) { alert('จำนวนสายลับมากเกินไป'); return }
    setStarting(true)

    const wordPair = getRandomWordPair()
    const assignments = assignRoles(players, undercoverCount, mrwhiteCount)

    // Update all player roles in DB
    await Promise.all(
      assignments.map((a) =>
        supabase.from('players').update({ role: a.role }).eq('id', a.playerId)
      )
    )

    // Update room settings + word pair
    await supabase.from('rooms').update({
      status: 'playing',
      undercover_count: undercoverCount,
      mrwhite_count: mrwhiteCount,
      turn_time_sec: turnTimeSec,
      word_pair: wordPair,
      host_player_id: room.host_player_id,
    }).eq('room_code', room.room_code)

    // Transition to reveal phase
    await supabase.from('game_state').update({ phase: 'reveal' }).eq('room_code', room.room_code)

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
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        {/* Room code */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-1">รหัสห้อง</p>
          <div className="text-5xl font-bold tracking-widest text-pink-600 font-mono">{room.room_code}</div>
          <div className="flex gap-2 mt-3 justify-center">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200 transition"
            >
              {copied ? '✓ คัดลอกแล้ว' : '🔗 คัดลอกลิงก์'}
            </button>
          </div>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">ผู้เล่น ({players.length} คน)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                  p.id === localPlayer.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <span className="text-xl">{p.is_host ? '👑' : '👤'}</span>
                <span className="font-medium text-gray-800">{p.name}</span>
                {p.id === localPlayer.id && <span className="ml-auto text-xs text-blue-500">(คุณ)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Host settings */}
        {isHost && (
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-3">
            <h3 className="font-semibold text-gray-700">ตั้งค่าเกม</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">🕵️ สายลับ (Undercover)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setUndercoverCount(Math.max(0, undercoverCount - 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">-</button>
                <span className="w-6 text-center font-bold">{undercoverCount}</span>
                <button onClick={() => setUndercoverCount(Math.min(maxImpostors - mrwhiteCount, undercoverCount + 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">❓ Mr. White</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setMrwhiteCount(Math.max(0, mrwhiteCount - 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">-</button>
                <span className="w-6 text-center font-bold">{mrwhiteCount}</span>
                <button onClick={() => setMrwhiteCount(Math.min(maxImpostors - undercoverCount, mrwhiteCount + 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">⏱️ เวลาพูด (วินาที)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setTurnTimeSec(Math.max(10, turnTimeSec - 10))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">-</button>
                <span className="w-8 text-center font-bold">{turnTimeSec}</span>
                <button onClick={() => setTurnTimeSec(Math.min(180, turnTimeSec + 10))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">+</button>
              </div>
            </div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || players.length < 3}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-2xl transition disabled:opacity-50"
          >
            {starting ? 'กำลังเริ่ม...' : '🎮 เริ่มเกม'}
          </button>
        ) : (
          <div className="text-center text-gray-500 py-3">รอ Host เริ่มเกม...</div>
        )}
      </div>
    </div>
  )
}
