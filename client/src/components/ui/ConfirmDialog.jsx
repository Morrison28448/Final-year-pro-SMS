import Modal from './Modal'
import Button from './Button'

const ConfirmDialog = ({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
  variant = 'danger',
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Processing…' : confirmLabel}
      </Button>
    </div>
  </Modal>
)

export default ConfirmDialog
