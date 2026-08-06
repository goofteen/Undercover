import p1  from '../assets/images/Avatar/Person 1.png'
import p2  from '../assets/images/Avatar/Person 2.png'
import p3  from '../assets/images/Avatar/Person 3.png'
import p4  from '../assets/images/Avatar/Person 4.png'
import p5  from '../assets/images/Avatar/Person 5.png'
import p6  from '../assets/images/Avatar/Person 6.png'
import p7  from '../assets/images/Avatar/Person 7.png'
import p8  from '../assets/images/Avatar/Person 8.png'
import p9  from '../assets/images/Avatar/Person 9.png'
import p10 from '../assets/images/Avatar/Person 10.png'

const AVATARS = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]

/** Deterministic: same name always gets the same avatar */
export function getAvatar(name: string): string {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATARS[Math.abs(hash) % AVATARS.length]
}
