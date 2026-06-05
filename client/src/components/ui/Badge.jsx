const VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger:  'bg-red-50 text-red-700 ring-red-600/20',
  info:    'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
}

const Badge = ({ label, variant = 'neutral' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${VARIANTS[variant] || VARIANTS.neutral}`}>
    {label}
  </span>
)

export default Badge
