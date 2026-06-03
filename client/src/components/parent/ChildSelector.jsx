import { useEffect } from 'react'
import useApi from '../../hooks/useApi'
import { fetchMyChildren } from '../../services/portal.service'
import Spinner from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'

const ChildSelector = ({ selectedId, onSelect }) => {
  const { data: children, loading, execute: load } = useApi(fetchMyChildren, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center gap-2 py-4"><Spinner size="md" /><span className="text-sm text-gray-500">Loading children…</span></div>
  }

  if (!children?.length) {
    return (
      <EmptyState
        icon="👨‍👩‍👧"
        title="No linked children"
        description="Ensure your phone number or name matches the guardian details on your child's student record."
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select child</label>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
      >
        <option value="">Choose a child…</option>
        {children.map((c) => (
          <option key={c.id} value={c.id}>
            {c.users?.first_name} {c.users?.last_name}
            {c.classes?.name ? ` — ${c.classes.name}` : ''}
            {c.admission_number ? ` (${c.admission_number})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ChildSelector
