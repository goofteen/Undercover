import type { Player, Role, Winner, WordPair } from '../types/game'

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface RoleAssignment {
  playerId: string
  role: Role
}

export function assignRoles(
  players: Player[],
  undercoverCount: number,
  mrwhiteCount: number,
): RoleAssignment[] {
  const shuffled = shuffle(players)
  const assignments: RoleAssignment[] = []
  let idx = 0

  for (let i = 0; i < mrwhiteCount; i++) {
    assignments.push({ playerId: shuffled[idx++].id, role: 'mrwhite' })
  }
  for (let i = 0; i < undercoverCount; i++) {
    assignments.push({ playerId: shuffled[idx++].id, role: 'undercover' })
  }
  while (idx < shuffled.length) {
    assignments.push({ playerId: shuffled[idx++].id, role: 'civilian' })
  }
  return assignments
}

export function getWordForRole(role: Role, wordPair: WordPair): string | null {
  if (role === 'civilian') return wordPair.civilian
  if (role === 'undercover') return wordPair.undercover
  return null // mrwhite gets no word
}

/** Count votes and return the player_id with the most votes. Tie → returns null. */
export function getEliminatedPlayer(votes: Record<string, string[]>): string | null {
  let maxVotes = 0
  let topPlayer: string | null = null
  let tie = false

  for (const [playerId, voters] of Object.entries(votes)) {
    if (voters.length > maxVotes) {
      maxVotes = voters.length
      topPlayer = playerId
      tie = false
    } else if (voters.length === maxVotes) {
      tie = true
    }
  }
  return tie ? null : topPlayer
}

/** Check win conditions after a player is eliminated */
export function checkWinCondition(
  players: Player[],
): Winner {
  const alive = players.filter((p) => !p.is_eliminated)
  const aliveCivilians = alive.filter((p) => p.role === 'civilian')
  const aliveImpostors = alive.filter((p) => p.role === 'undercover' || p.role === 'mrwhite')

  // Impostors win if alive impostors >= alive civilians
  if (aliveImpostors.length >= aliveCivilians.length) return 'impostor'

  // Civilians win if no impostors remain
  if (aliveImpostors.length === 0) return 'civilian'

  return null
}

/** Get description order: non-eliminated players sorted by join_order */
export function getDescriptionOrder(players: Player[]): Player[] {
  return players.filter((p) => !p.is_eliminated).sort((a, b) => a.join_order - b.join_order)
}
