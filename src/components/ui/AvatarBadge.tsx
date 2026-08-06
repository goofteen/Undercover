const COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#E91E63',
]

function getColor(name: string) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  eliminated?: boolean
  speaking?: boolean
  selected?: boolean
  voted?: boolean
  /** Use 'light' on paper/light backgrounds so the name text is dark */
  textTheme?: 'dark' | 'light'
}

const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-lg', lg: 'w-20 h-20 text-2xl' }

export default function AvatarBadge({ name, size = 'md', eliminated, speaking, selected, voted, textTheme = 'dark' }: Props) {
  const bg = getColor(name)
  const initial = name.charAt(0).toUpperCase()
  const sizeClass = sizes[size]

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-heading font-bold text-white shadow-uc-soft transition-all duration-200 ${
          eliminated ? 'opacity-30 grayscale' : ''
        } ${speaking ? 'ring-2 ring-uc-gold shadow-uc-gold-glow' : ''} ${
          selected ? 'ring-2 ring-uc-danger' : ''
        }`}
        style={{ backgroundColor: bg }}
      >
        {initial}
      </div>
      {voted && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-uc-success rounded-full flex items-center justify-center text-white text-xs font-bold">
          ✓
        </div>
      )}
      {eliminated && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-uc-danger rotate-45 absolute" />
        </div>
      )}
      <span className={`text-xs font-mono truncate max-w-16 ${eliminated ? 'line-through text-gray-500' : textTheme === 'light' ? 'text-uc-ink font-semibold' : 'text-uc-paper'}`}>
        {name}
      </span>
    </div>
  )
}
