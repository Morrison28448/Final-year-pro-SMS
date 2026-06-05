/**
 * Card — elevated surface container
 */
const Card = ({ children, className = '', hover = false, padding = true }) => (
  <div className={`card overflow-hidden ${hover ? 'card-hover' : ''} ${className}`}>
    {padding ? <div className="card-body">{children}</div> : children}
  </div>
)

export const CardHeader = ({ title, subtitle, action, children }) => (
  <div className="card-header">
    {children || (
      <>
        <div>
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </>
    )}
  </div>
)

export default Card
