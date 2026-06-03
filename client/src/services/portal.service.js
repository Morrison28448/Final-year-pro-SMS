import api from '../api/axios'

/** GET /api/portal/me — resolve user → student/teacher profile */
export const fetchPortalProfile = async () => {
  const { data } = await api.get('/portal/me')
  return data.profile
}

/** GET /api/portal/my-attendance */
export const fetchMyAttendance = async (params = {}) => {
  const { data } = await api.get('/portal/my-attendance', { params })
  return data // { records, summary }
}

/** GET /api/portal/my-results */
export const fetchMyResults = async () => {
  const { data } = await api.get('/portal/my-results')
  return data // { student, exams }
}

/** GET /api/portal/my-timetable */
export const fetchMyTimetable = async () => {
  const { data } = await api.get('/portal/my-timetable')
  return data // { subjects }
}

/** GET /api/portal/my-classes (teacher) */
export const fetchMyClasses = async () => {
  const { data } = await api.get('/portal/my-classes')
  return data // { classes }
}

/** GET /api/portal/my-students (teacher) */
export const fetchMyStudents = async () => {
  const { data } = await api.get('/portal/my-students')
  return data // { students }
}

/** GET /api/portal/modules */
export const fetchSchoolModules = async () => {
  const { data } = await api.get('/portal/modules')
  return data.modules
}

/** GET /api/portal/my-children (parent) */
export const fetchMyChildren = async () => {
  const { data } = await api.get('/portal/my-children')
  return data.children
}

/** GET /api/portal/children/:id/attendance */
export const fetchChildAttendance = async (studentId, params = {}) => {
  const { data } = await api.get(`/portal/children/${studentId}/attendance`, { params })
  return data
}

/** GET /api/portal/children/:id/results */
export const fetchChildResults = async (studentId) => {
  const { data } = await api.get(`/portal/children/${studentId}/results`)
  return data
}
