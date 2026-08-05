import { supabase } from '../../lib/supabase'
import type { GameState, LocalPlayerInfo, Player, Room } from '../../types/game'

interface Props {
  room: Room
  players: Player[]
  gameState: GameState
  localPlayer: LocalPlayerInfo
}

export default function GameOverScreen({ room, players, gameState, localPlayer }: Props) {
  const myPlayer = players.find((p) => p.id === localPlayer.id)
  const isHost = myPlayer?.is_host
  const winner = gameState.winner

  const winnerConfig = {
    civilian: { emoji: '🎉', label: 'พลเมืองชนะ!', color: 'from-blue-400 to-cyan-500', desc: 'พลเมืองสามารถจับสายลับทั้งหมดได้!' },
    impostor: { emoji: '🕵️', label: 'สายลับชนะ!', color: 'from-red-400 to-pink-500', desc: 'สายลับอยู่รอดจนเหลือพลเมืองเพียงคนเดียว!' },
    mrwhite: { emoji: '❓', label: 'Mr. White ชนะ!', color: 'from-gray-500 to-slate-600', desc: 'Mr. White เดาคำลับของพลเมืองถูก!' },
    null: { emoji: '🎮', label: 'เกมจบแล้ว', color: 'from-gray-400 to-gray-500', desc: '' },
  }[winner ?? 'null']

  const myRole = myPlayer?.role
  const myWord = myRole === 'civilian' ? room.word_pair?.civilian :
                 myRole === 'undercover' ? room.word_pair?.undercover : null

  // Determine if local player won
  const iWon = (winner === 'civilian' && myRole === 'civilian') ||
               (winner === 'impostor' && (myRole === 'undercover' || myRole === 'mrwhite')) ||
               (winner === 'mrwhite' && myRole === 'mrwhite')

  async function handlePlayAgain() {
    // Reset room to lobby
    await supabase.from('rooms').update({ status: 'lobby', word_pair: null }).eq('room_code', room.room_code)
    await supabase.from('players').update({ role: null, is_eliminated: false }).eq('room_code', room.room_code)
    await supabase.from('game_state').update({
      phase: 'lobby',
      current_player_index: 0,
      round: 1,
      votes: {},
      winner: null,
    }).eq('room_code', room.room_code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
        {/* Result banner */}
        <div className={`bg-gradient-to-br ${winnerConfig.color} rounded-2xl p-6 text-white mb-6`}>
          <div className="text-5xl mb-2">{winnerConfig.emoji}</div>
          <h2 className="text-3xl font-bold">{winnerConfig.label}</h2>
          <p className="text-white/80 mt-1 text-sm">{winnerConfig.desc}</p>
        </div>

        {/* Your result */}
        <div className={`rounded-2xl p-4 mb-6 ${iWon ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
          <p className={`text-lg font-bold ${iWon ? 'text-green-600' : 'text-red-500'}`}>
            {iWon ? '🏆 คุณชนะ!' : '😔 คุณแพ้'}
          </p>
          {myWord && <p className="text-gray-500 text-sm mt-1">คำของคุณคือ: <span className="font-bold text-gray-700">{myWord}</span></p>}
        </div>

        {/* Word reveal */}
        {room.word_pair && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">คู่คำในเกมนี้</p>
            <div className="flex justify-around">
              <div>
                <p className="text-xs text-blue-500">พลเมือง</p>
                <p className="text-xl font-bold text-gray-800">{room.word_pair.civilian}</p>
              </div>
              <div className="text-gray-300 text-2xl">vs</div>
              <div>
                <p className="text-xs text-red-500">สายลับ</p>
                <p className="text-xl font-bold text-gray-800">{room.word_pair.undercover}</p>
              </div>
            </div>
          </div>
        )}

        {/* All players roles */}
        <div className="text-left space-y-2 mb-6">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">บทบาทผู้เล่น</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span>{p.role === 'civilian' ? '👤' : p.role === 'undercover' ? '🕵️' : '❓'}</span>
                <span className="text-gray-700">{p.name}</span>
                {p.id === localPlayer.id && <span className="text-xs text-blue-500">(คุณ)</span>}
              </div>
              <span className={`text-sm font-medium ${
                p.role === 'civilian' ? 'text-blue-500' :
                p.role === 'undercover' ? 'text-red-500' : 'text-gray-600'
              }`}>
                {p.role === 'civilian' ? 'พลเมือง' : p.role === 'undercover' ? 'สายลับ' : 'Mr.White'}
              </span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            onClick={handlePlayAgain}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl transition shadow-lg"
          >
            🎮 เล่นอีกรอบ
          </button>
        )}
        {!isHost && (
          <p className="text-gray-400 text-sm">รอ Host เริ่มรอบใหม่...</p>
        )}
      </div>
    </div>
  )
}
