'use client'

import Modal from '@/components/ui/Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  loading?: boolean
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'جاري الحذف...' : 'حذف'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] text-sm hover:bg-[var(--color-background)] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </Modal>
  )
}
