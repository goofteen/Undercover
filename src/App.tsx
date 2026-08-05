import { useEffect, useState } from 'react'
import { useRoom } from './hooks/useRoom'
import { useGameState } from './hooks/useGameState'
import type { LocalPlayerInfo } from './types/game'
import { getWordForRole } from './lib/gameLogic'

import HomeScreen from './components/screens/HomeScreen'
import LobbyScreen from './components/screens/LobbyScreen'
import WordRevealScreen from './components/screens/WordRevealScreen'
import DescriptionScreen from './components/screens/DescriptionScreen'
import VotingScreen from './components/screens/VotingScreen'
import EliminationScreen from './components/screens/EliminationScreen'
import MrWhiteGuessScreen from './components/screens/MrWhiteGuessScreen'
import GameOverScreen from './components/screens/GameOverScreen'
import LeaveButton from './components/ui/LeaveButton'

const LOCAL_KEY = 'undercover_player'

function loadLocalPlayer(): LocalPlayerInfo | null {
  try {
    const raw = sessionStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function saveLocalPlayer(info: LocalPlayerInfo) {
  sessionStorage.setItem(LOCAL_KEY, JSON.stringify(info))
}

export default function App() {
  const [localPlayer, setLocalPlayer] = useState<LocalPlayerInfo | null>(() => loadLocalPlayer())

  const { room, players, loading } = useRoom(localPlayer?.room_code ?? null)
  const { gameState } = useGameState(localPlayer?.room_code ?? null)

  // Sync role/word when game transitions to reveal and we got the role from DB
  useEffect(() => {
    if (!localPlayer || localPlayer.role) return
    const myPlayer = players.find((p) => p.id === localPlayer.id)
    if (myPlayer?.role && room?.word_pair) {
      const word = getWordForRole(myPlayer.role, room.word_pair)
      const updated = { ...localPlayer, role: myPlayer.role, word }
      setLocalPlayer(updated)
      saveLocalPlayer(updated)
    }
  }, [players, room, localPlayer])

  // Reset local role when room goes back to lobby (play again)
  useEffect(() => {
    if (!localPlayer || !gameState) return
    if (gameState.phase === 'lobby' && localPlayer.role) {
      const updated = { ...localPlayer, role: null, word: null }
      setLocalPlayer(updated)
      saveLocalPlayer(updated)
    }
  }, [gameState?.phase])

  function handleJoined(info: LocalPlayerInfo) {
    saveLocalPlayer(info)
    setLocalPlayer(info)
  }

  function handleRoleAssigned(role: LocalPlayerInfo['role'], word: string | null) {
    if (!localPlayer) return
    const updated = { ...localPlayer, role, word }
    setLocalPlayer(updated)
    saveLocalPlayer(updated)
  }

  function handleLeave() {
    sessionStorage.removeItem(LOCAL_KEY)
    setLocalPlayer(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (!localPlayer) return <HomeScreen onJoined={handleJoined} />

  if (loading || !room || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  const leaveBtn = <LeaveButton onLeave={handleLeave} />

  if (gameState.phase === 'lobby' || room.status === 'lobby') {
    return (
      <>{leaveBtn}
      <LobbyScreen
        room={room}
        players={players}
        localPlayer={localPlayer}
        onRoleAssigned={handleRoleAssigned}
      /></>
    )
  }

  if (gameState.phase === 'reveal') {
    return (
      <>{leaveBtn}
      <WordRevealScreen
        room={room}
        players={players}
        localPlayer={localPlayer}
        onReady={() => {}}
      /></>
    )
  }

  if (gameState.phase === 'description') {
    return (
      <>{leaveBtn}
      <DescriptionScreen
        room={room}
        players={players}
        gameState={gameState}
        localPlayer={localPlayer}
      /></>
    )
  }

  if (gameState.phase === 'voting') {
    return (
      <>{leaveBtn}
      <VotingScreen
        room={room}
        players={players}
        gameState={gameState}
        localPlayer={localPlayer}
      /></>
    )
  }

  if (gameState.phase === 'elimination') {
    return (
      <>{leaveBtn}
      <EliminationScreen
        room={room}
        players={players}
        gameState={gameState}
        localPlayer={localPlayer}
      /></>
    )
  }

  if (gameState.phase === 'mrwhite_guess') {
    return (
      <>{leaveBtn}
      <MrWhiteGuessScreen
        room={room}
        players={players}
        gameState={gameState}
        localPlayer={localPlayer}
      /></>
    )
  }

  if (gameState.phase === 'gameover') {
    return (
      <>{leaveBtn}
      <GameOverScreen
        room={room}
        players={players}
        gameState={gameState}
        localPlayer={localPlayer}
      /></>
    )
  }

  return <HomeScreen onJoined={handleJoined} />
}
