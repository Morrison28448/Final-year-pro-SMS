import api from '../api/axios'

// ── Classes ───────────────────────────────────────────────────────────────────
export const fetchClasses = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/academics/classes', { params: { page, limit } })
  return data
}
export const createClass = async (payload) => {
  const { data } = await api.post('/academics/classes', payload)
  return data.class
}
export const updateClass = async (id, payload) => {
  const { data } = await api.put(`/academics/classes/${id}`, payload)
  return data.class
}
export const deleteClass = async (id) => {
  await api.delete(`/academics/classes/${id}`)
}
export const assignSubjectsToClass = async (classId, subjectIds) => {
  const { data } = await api.post(`/academics/classes/${classId}/subjects`, { subjectIds })
  return data.assignments
}

/**
 * Assign (or unassign) a teacher to a subject within a class.
 * Pass teacherId = null to remove the assignment.
 */
export const assignTeacherToSubject = async (classId, subjectId, teacherId) => {
  const { data } = await api.patch(
    `/academics/classes/${classId}/subjects/${subjectId}/teacher`,
    { teacherId }
  )
  return data.assignment
}

// ── Subjects ──────────────────────────────────────────────────────────────────
export const fetchSubjects = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/academics/subjects', { params: { page, limit } })
  return data
}
export const createSubject = async (payload) => {
  const { data } = await api.post('/academics/subjects', payload)
  return data.subject
}
export const updateSubject = async (id, payload) => {
  const { data } = await api.put(`/academics/subjects/${id}`, payload)
  return data.subject
}
export const deleteSubject = async (id) => {
  await api.delete(`/academics/subjects/${id}`)
}

// ── Teacher portal helpers ────────────────────────────────────────────────────
export const fetchMyTeacherClasses = async () => {
  const { data } = await api.get('/academics/my-classes')
  return data.classes
}
export const fetchMyTeacherSubjects = async (classId) => {
  const { data } = await api.get(`/academics/my-subjects/${classId}`)
  return data.subjects
}
