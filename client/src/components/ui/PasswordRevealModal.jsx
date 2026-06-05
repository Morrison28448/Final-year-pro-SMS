import { useState } from 'react'
import Modal from './Modal'

/**
 * PasswordRevealModal
 * Shown after creating a user or resetting their password.
 * Displays the generated password with a copy button.
 *
 * Props:
 *  open        boolean
 *  onClose     () => void
 *  name        string   — user's full name
 *  email       string
 *  password    string   — the plain-text generated password
 *  isReset     boolean  — true = "reset", false = "created"
 */
const PasswordRevealModal = ({ open, onClose, name, email, password, isReset = false }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = password
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReset ? '🔑 Password Reset' : '✅ Account Created'}
      size="sm"
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-semibold mb-0.5">
            {isReset ? 'New password generated' : 'Account created successfully'}
          </p>
          <p className="text-xs">
            Share this password with {name?.split(' ')[0] || 'the user'}.
            It will <strong>not</strong> be shown again.
          </p>
        </div>

        {/* User info */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900 text-xs">{email}</span>
          </div>
        </div>

        {/* Password display */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Generated Password
          </p>
          <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-xl">
            <code className="flex-1 text-green-400 font-mono text-lg tracking-widest select-all">
              {password}
            </code>
            <button
              onClick={handleCopy}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Portal link hint */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <p className="font-semibold mb-0.5">Portal login</p>
          <p>
            Direct {name?.split(' ')[0]} to{' '}
            <span className="font-mono bg-blue-100 px-1 rounded">
              {window.location.origin}
            </span>{' '}
            to sign in.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Done
        </button>
      </div>
    </Modal>
  )
}

export default PasswordRevealModal
