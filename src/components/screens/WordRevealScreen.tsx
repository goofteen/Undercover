import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { LocalPlayerInfo, Player, Room } from '../../types/game'
import { getWordForRole } from '../../lib/gameLogic'

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
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">คำลับของคุณ</h2>
        <p className="text-gray-500 mb-6 text-sm">อย่าให้คนอื่นเห็น!</p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-8 bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition"
          >
            แตะเพื่อดูคำลับ 👁️
          </button>
        ) : (
          <div>
            {word ? (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
                <p className="text-gray-500 text-sm mb-1">คำลับของคุณคือ</p>
                <p className="text-4xl font-bold text-gray-800">{word}</p>
                <p className="text-gray-400 text-xs mt-3">คุณอาจเป็นพลเมืองหรือสายลับ — ยังไม่มีใครรู้!</p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <p className="text-gray-500 text-sm mb-1">คุณคือ Mr. White</p>
                <p className="text-gray-600">คุณไม่มีคำลับ — ต้องแอบฟังแล้วเดาเอาเอง!</p>
              </div>
            )}

            {!ready ? (
              <button
                onClick={handleReady}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-2xl transition"
              >
                {myPlayer?.is_host ? 'เริ่มเกมได้เลย →' : 'พร้อมแล้ว ✓'}
              </button>
            ) : (
              <div className="text-gray-500">
                {myPlayer?.is_host ? 'กำลังเริ่ม...' : 'รอ Host เริ่มรอบ...'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
