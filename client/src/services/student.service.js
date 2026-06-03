import api from '../api/axios'

export const fetchStudents = async ({ page = 1, limit = 10, search = '', classId = '' } = {}) => {
  const { data } = await api.get('/students', { params: { page, limit, search, classId } })
  return data // { students, pagination }
}

export const fetchStudentById = async (id) => {
  const { data } = await api.get(`/students/${id}`)
  return data.student
}

export const createStudent = async (payload) => {
  const { data } = await api.post('/students', payload)
  // Returns { student, generatedPassword }
  return data
}

export const updateStudent = async (id, payload) => {
  const { data } = await api.put(`/students/${id}`, payload)
  return data.student
}

export const deleteStudent = async (id) => {
  await api.delete(`/students/${id}`)
}

export const assignClass = async (id, classId) => {
  const { data } = await api.patch(`/students/${id}/assign-class`, { classId })
  return data.student
}

export const fetchClasses = async () => {
  const { data } = await api.get('/students/classes')
  return data.classes
}

export const resetStudentPassword = async (id) => {
  const { data } = await api.post(`/students/${id}/reset-password`)
  // Returns { studentId, name, email, generatedPassword }
  return data
}
