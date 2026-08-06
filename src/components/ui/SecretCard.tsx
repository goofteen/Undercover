import { useState } from 'react'
import { motion } from 'framer-motion'
import paperTexture from '../../assets/textures/paper.png'
import folderTexture from '../../assets/textures/folder.png'

interface Props {
  word: string | null
  isMrWhite: boolean
  onRevealed?: () => void
}

export default function SecretCard({ word, isMrWhite, onRevealed }: Props) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (flipped) return
    setFlipped(true)
    onRevealed?.()
  }

  return (
    <div className="perspective-[1000px] w-72 h-96 mx-auto cursor-pointer" onClick={handleFlip}>
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.3, 0.7, 0.3, 1] }}
      >
        {/* Front — sealed envelope */}
        <div
          className="absolute inset-0 rounded-uc-3 shadow-uc-paper flex flex-col items-center justify-center gap-4"
          style={{
            backfaceVisibility: 'hidden',
            backgroundImage: `url(${folderTexture})`,
            backgroundSize: 'cover',
          }}
        >
          {/* Wax seal */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-uc-large"
            style={{ background: 'radial-gradient(circle at 40% 35%, #E85A4A, #A62B22)' }}>
            <span className="text-uc-paper font-heading text-2xl">U</span>
          </div>
          <p className="font-heading text-uc-ink text-lg tracking-wider">TOP SECRET</p>
          <p className="text-uc-ink-soft text-sm font-body">แตะเพื่อเปิดซอง</p>

          {/* Tape */}
          <div className="absolute top-4 right-4 px-3 py-1 text-xs font-mono uppercase tracking-widest text-uc-paper opacity-90 rotate-[-8deg]"
            style={{
              background: 'repeating-linear-gradient(135deg, #D4AF37 0px, #D4AF37 4px, #B3922B 4px, #B3922B 8px)',
              boxShadow: '0 2px 6px rgba(0,0,0,.3)',
            }}>
            CLASSIFIED
          </div>
        </div>

        {/* Back — revealed word */}
        <div
          className="absolute inset-0 rounded-uc-3 shadow-uc-paper flex flex-col items-center justify-center gap-3 p-6"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundImage: `url(${paperTexture})`,
            backgroundSize: 'cover',
          }}
        >
          {isMrWhite ? (
            <>
              <p className="font-heading text-uc-danger text-2xl tracking-wider rotate-[-8deg] border-4 border-uc-danger px-4 py-2 opacity-90">
                CLASSIFIED
              </p>
              <p className="text-uc-ink-soft font-body text-sm mt-4 text-center">
                คุณคือ Mr. White<br/>ไม่มีคำลับ — แอบฟังแล้วเดาเอา!
              </p>
            </>
          ) : (
            <>
              <p className="text-uc-ink-soft font-mono text-xs uppercase tracking-widest">คำลับของคุณ</p>
              <p className="font-heading text-4xl text-uc-ink">{word}</p>
              <div className="w-32 h-px bg-uc-ink opacity-20 mt-2" />
              <p className="text-uc-ink-soft text-xs font-body text-center mt-2">
                คุณอาจเป็นพลเมืองหรือสายลับ<br/>ยังไม่มีใครรู้!
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
