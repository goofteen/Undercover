import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children, key }: { children: ReactNode; key?: string }) {
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.25, 0.7, 0.35, 1] }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
