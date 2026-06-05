import { useModules } from '../context/ModuleContext'
import EmptyState from './ui/EmptyState'

const MODULE_LABELS = {
  attendance: 'Attendance',
  exams:      'Exams & Results',
}

const ModuleGate = ({ moduleName, children }) => {
  const { isModuleEnabled, loading } = useModules()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner-ring" />
      </div>
    )
  }

  if (!isModuleEnabled(moduleName)) {
    const label = MODULE_LABELS[moduleName] || moduleName
    return (
      <EmptyState
        icon="🔒"
        title={`${label} is disabled`}
        description={`Your school administrator has turned off the ${label} module. Contact your school admin to enable it.`}
      />
    )
  }

  return children
}

export default ModuleGate
