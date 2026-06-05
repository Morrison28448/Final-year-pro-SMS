const FormField = ({ label, error, required = false, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="label-field">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
)

export default FormField
