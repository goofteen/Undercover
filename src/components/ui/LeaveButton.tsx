import { useState } from 'react'

interface Props {
  onLeave: () => void
}

export default function LeaveButton({ onLeave }: Props) {
  const [confirm, setConfirm] = useState(false)

  if (confirm) {
    return (
      <div className="fixed top-4 left-4 bg-white rounded-2xl shadow-xl p-4 z-50">
        <p className="text-gray-700 text-sm mb-3">ออกจากเกมนี้?</p>
        <div className="flex gap-2">
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
          >
            ออกเกม
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300"
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
      className="fixed top-4 left-4 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-500 transition z-50"
      title="ออกจากเกม"
    >
      ✕
    </button>
  )
}
