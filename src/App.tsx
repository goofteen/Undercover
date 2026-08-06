import { lazy, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useRoom } from './hooks/useRoom'
import type { LocalPlayerInfo } from './types/game'
import { getWordForRole } from './lib/gameLogic'

const HomeScreen = lazy(() => import('./components/screens/HomeScreen'))
const LobbyScreen = lazy(() => import('./components/screens/LobbyScreen'))
const WordRevealScreen = lazy(() => import('./components/screens/WordRevealScreen'))
const DescriptionScreen = lazy(() => import('./components/screens/DescriptionScreen'))
const VotingScreen = lazy(() => import('./components/screens/VotingScreen'))
const EliminationScreen = lazy(() => import('./components/screens/EliminationScreen'))
const MrWhiteGuessScreen = lazy(() => import('./components/screens/MrWhiteGuessScreen'))
const GameOverScreen = lazy(() => import('./components/screens/GameOverScreen'))
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

  const { room, players, gameState, loading } = useRoom(localPlayer?.room_code ?? null)

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

  async function handleLeave() {
    if (localPlayer) {
      await supabase.from('players').delete().eq('id', localPlayer.id)
    }
    sessionStorage.removeItem(LOCAL_KEY)
    setLocalPlayer(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (!localPlayer) return <HomeScreen onJoined={handleJoined} />

  if (loading || !room || !gameState) {
    return (
      <div className="min-h-screen bg-uc-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse-glow">🕵️</div>
          <p className="font-heading text-uc-gold tracking-wider animate-pulse">กำลังโหลด...</p>
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
