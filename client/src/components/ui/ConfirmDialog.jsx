import Modal from './Modal'

/**
 * ConfirmDialog — simple yes/no confirmation modal
 *
 * Props:
 *  open        boolean
 *  onClose     () => void
 *  onConfirm   () => void
 *  title       string
 *  message     string
 *  confirmLabel string  (default: 'Delete')
 *  loading     boolean
 *  variant     'danger' | 'warning'
 */
const ConfirmDialog = ({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
  variant = 'danger',
}) => {
  const btnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-yellow-500 hover:bg-yellow-600 text-white'

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition ${btnClass}`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
