import api from '../api/axios'

export const fetchSchoolProfile = async () => {
  const { data } = await api.get('/settings/school')
  return data.school
}
export const updateSchoolProfile = async (payload) => {
  const { data } = await api.put('/settings/school', payload)
  return data.school
}
export const updateProfile = async (payload) => {
  const { data } = await api.put('/settings/profile', payload)
  return data.user
}
export const changePassword = async (payload) => {
  const { data } = await api.put('/settings/password', payload)
  return data
}
