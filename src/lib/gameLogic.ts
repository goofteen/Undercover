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

/** Count votes and return the player_id with the most votes.
 *  Tie → null. Skip votes >= max player votes → null (no one eliminated). */
export function getEliminatedPlayer(votes: Record<string, string[]>): string | null {
  const skipCount = votes['__skip__']?.length ?? 0
  let maxVotes = 0
  let topPlayer: string | null = null
  let tie = false

  for (const [playerId, voters] of Object.entries(votes)) {
    if (playerId === '__skip__') continue
    if (voters.length > maxVotes) {
      maxVotes = voters.length
      topPlayer = playerId
      tie = false
    } else if (voters.length === maxVotes) {
      tie = true
    }
  }
  // If skips >= max votes, no one gets eliminated
  if (skipCount >= maxVotes) return null
  return tie ? null : topPlayer
}

/** Check win conditions after a player is eliminated */
export function checkWinCondition(
  players: Player[],
): Winner {
  const alive = players.filter((p) => !p.is_eliminated)
  const aliveCivilians = alive.filter((p) => p.role === 'civilian')
  const aliveUndercovers = alive.filter((p) => p.role === 'undercover')
  const aliveMrWhites = alive.filter((p) => p.role === 'mrwhite')

  // Civilians win if no undercovers AND no mr.whites remain
  if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) return 'civilian'

  // Undercovers win if alive undercovers >= alive civilians (mr.white ไม่นับ)
  if (aliveUndercovers.length >= aliveCivilians.length) return 'impostor'

  return null
}

/** Get description order: non-eliminated players sorted by join_order */
export function getDescriptionOrder(players: Player[]): Player[] {
  return players.filter((p) => !p.is_eliminated).sort((a, b) => a.join_order - b.join_order)
}
