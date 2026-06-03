import api from '../api/axios'

/** GET /api/attendance/classes */
export const fetchAttendanceClasses = async () => {
  const { data } = await api.get('/attendance/classes')
  return data.classes
}

/** GET /api/attendance/sheet?classId&date */
export const fetchAttendanceSheet = async ({ classId, date }) => {
  const { data } = await api.get('/attendance/sheet', { params: { classId, date } })
  return data // { date, classId, sheet }
}

/** POST /api/attendance/mark */
export const markAttendance = async ({ classId, date, records }) => {
  const { data } = await api.post('/attendance/mark', { classId, date, records })
  return data.records
}

/** PATCH /api/attendance/:id */
export const updateAttendanceRecord = async (id, payload) => {
  const { data } = await api.patch(`/attendance/${id}`, payload)
  return data.record
}

/** GET /api/attendance/stats?classId&startDate&endDate */
export const fetchAttendanceStats = async (params = {}) => {
  const { data } = await api.get('/attendance/stats', { params })
  return data.stats
}

/** GET /api/attendance/student/:studentId?startDate&endDate */
export const fetchStudentReport = async (studentId, params = {}) => {
  const { data } = await api.get(`/attendance/student/${studentId}`, { params })
  return data // { records, summary }
}

/** GET /api/attendance?date&classId&page&limit */
export const fetchAttendanceRecords = async (params = {}) => {
  const { data } = await api.get('/attendance', { params })
  return data // { records, pagination }
}
