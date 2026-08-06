import { motion } from 'framer-motion'

interface Props {
  text: string
  color?: 'red' | 'gold'
  delay?: number
}

export default function StampEffect({ text, color = 'red', delay = 0.3 }: Props) {
  const borderColor = color === 'red' ? 'border-uc-danger' : 'border-uc-gold'
  const textColor = color === 'red' ? 'text-uc-danger' : 'text-uc-gold'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 3, rotate: -14 }}
      animate={{ opacity: 0.9, scale: 1, rotate: -14 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.7, 0.35, 1] }}
      className={`inline-block border-4 ${borderColor} rounded-uc px-6 py-3`}
      style={{ mixBlendMode: 'multiply' }}
    >
      <span className={`font-heading text-3xl ${textColor} tracking-[.18em] uppercase`}>
        {text}
      </span>
    </motion.div>
  )
}
