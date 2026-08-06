import { useState } from 'react'
import { SignOut } from '@phosphor-icons/react'

interface Props {
  onLeave: () => void
}

export default function LeaveButton({ onLeave }: Props) {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="fixed top-4 left-4 bg-uc-surface border border-white/10 rounded-uc-2 shadow-uc-large p-4 z-50">
        <p className="text-white/80 text-sm font-body mb-3">ออกจากเกมนี้?</p>
        <div className="flex gap-2">
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-uc-danger text-white rounded-uc text-sm font-heading hover:brightness-110 active:scale-[0.98] transition"
          >
            ออกเกม
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-4 py-2 bg-white/10 text-white/70 rounded-uc text-sm font-body hover:bg-white/20 transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="fixed top-4 left-4 w-10 h-10 bg-uc-surface/80 hover:bg-uc-surface border border-white/10 rounded-full shadow-uc-soft flex items-center justify-center text-white/50 hover:text-uc-danger transition z-50"
      title="ออกจากเกม"
    >
      <SignOut size={18} weight="bold" />
    </button>
  )
}
