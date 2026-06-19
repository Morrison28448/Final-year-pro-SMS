import { useEffect, useState, useCallback } from 'react'
import useApi from '../../hooks/useApi'
import { fetchAllSchools, toggleSchoolStatus } from '../../services/superAdmin.service'
import PageHeader from '../../components/ui/PageHeader'
import SchoolsTable from '../../components/super-admin/SchoolsTable'

const SuperAdminSchoolsPage = () => {
  const {
    data: schoolsData,
    loading: schoolsLoading,
    execute: loadSchools,
    setData: setSchoolsData,
  } = useApi(fetchAllSchools, { schools: [], pagination: {} })

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    loadSchools({ page, limit: 10, search })
  }, [page, search, loadSchools])

  const handleSearch = useCallback((term) => {
    setSearch(term)
    setPage(1)
  }, [])

  const handleToggle = useCallback(async (school) => {
    setTogglingId(school.id)
    try {
      const updated = await toggleSchoolStatus(school.id)
      setSchoolsData((prev) => ({
        ...prev,
        schools: prev.schools.map((s) =>
          s.id === updated.id ? { ...s, is_active: updated.is_active } : s
        ),
      }))
    } finally {
      setTogglingId(null)
    }
  }, [setSchoolsData])

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <PageHeader
        title="Schools"
        subtitle="View and manage all registered schools on the platform."
      />
      <SchoolsTable
        schools={schoolsData?.schools || []}
        loading={schoolsLoading}
        pagination={schoolsData?.pagination || {}}
        search={search}
        togglingId={togglingId}
        onSearch={handleSearch}
        onPageChange={setPage}
        onToggle={handleToggle}
      />
    </div>
  )
}

export default SuperAdminSchoolsPage
