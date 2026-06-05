import api from '../api/axios'

// ── Academic Years ─────────────────────────────────────────────────────────
export const fetchAcademicYears = async () => {
  const { data } = await api.get('/academic-years')
  return data.years
}
export const fetchAcademicYearById = async (id) => {
  const { data } = await api.get(`/academic-years/${id}`)
  return data.year
}
export const createAcademicYear = async (payload) => {
  const { data } = await api.post('/academic-years', payload)
  return data.year
}
export const updateAcademicYear = async (id, payload) => {
  const { data } = await api.put(`/academic-years/${id}`, payload)
  return data.year
}
export const deleteAcademicYear = async (id) => {
  await api.delete(`/academic-years/${id}`)
}

// ── Class progression ──────────────────────────────────────────────────────
export const fetchClassLevels = async () => {
  const { data } = await api.get('/academic-years/class-levels')
  return data.levels
}
export const saveClassLevels = async (levels) => {
  const { data } = await api.put('/academic-years/class-levels', { levels })
  return data.levels
}

// ── Student enrolment & promotion ──────────────────────────────────────────
export const enrolStudents = async (yearId) => {
  const { data } = await api.post(`/academic-years/${yearId}/enrol`)
  return data
}
export const promoteStudents = async (fromYearId, toYearId) => {
  const { data } = await api.post(`/academic-years/${fromYearId}/promote`, { toYearId })
  return data
}
export const fetchStudentRecords = async (yearId) => {
  const { data } = await api.get(`/academic-years/${yearId}/students`)
  return data.records
}
