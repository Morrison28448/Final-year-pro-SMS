/**
 * FormField — labelled input wrapper
 *
 * Props:
 *  label       string
 *  error       string   — validation error message
 *  required    boolean
 *  children    ReactNode — the actual input/select element
 */
const FormField = ({ label, error, required = false, children }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
)

export default FormField
