import api from '../api/axios'

export const fetchTeachers = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/teachers', { params: { page, limit, search } })
  return data
}

export const createTeacher = async (payload) => {
  const { data } = await api.post('/teachers', payload)
  // Returns { teacher, generatedPassword }
  return data
}

export const updateTeacher = async (id, payload) => {
  const { data } = await api.put(`/teachers/${id}`, payload)
  return data.teacher
}

export const deleteTeacher = async (id) => {
  await api.delete(`/teachers/${id}`)
}

export const resetTeacherPassword = async (id) => {
  const { data } = await api.post(`/teachers/${id}/reset-password`)
  // Returns { teacherId, name, email, generatedPassword }
  return data
}
