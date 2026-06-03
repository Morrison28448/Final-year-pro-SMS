import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import { ROLE_LABELS_SETTINGS_TAB } from '../../utils/constants'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import FormField     from '../../components/ui/FormField'
import Input         from '../../components/ui/Input'
import Spinner       from '../../components/ui/Spinner'
import {
  fetchSchoolProfile, updateSchoolProfile,
  updateProfile, changePassword,
} from '../../services/settings.service'
import { getErrorMessage } from '../../utils/helpers'

const TABS = [
  { id: 'school',   label: '🏫  School Profile' },
  { id: 'personal', label: '👤  My Profile' },
  { id: 'password', label: '🔒  Password' },
]

// ── Save button ───────────────────────────────────────────────────────────────
const SaveBtn = ({ loading, label = 'Save Changes' }) => (
  <button type="submit" disabled={loading}
    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
    {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
    {loading ? 'Saving…' : label}
  </button>
)

// ── Alert ─────────────────────────────────────────────────────────────────────
const Alert = ({ msg, type }) => msg ? (
  <div className={`p-3 rounded-lg text-sm ${type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
    {msg}
  </div>
) : null

// ── Main Page ─────────────────────────────────────────────────────────────────
const defaultSettingsTab = (role) =>
  ROLE_LABELS_SETTINGS_TAB[role] || 'personal'

const SettingsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(() => defaultSettingsTab(user?.role))

  useEffect(() => {
    setActiveTab(defaultSettingsTab(user?.role))
  }, [user?.role])

  // ── School profile ────────────────────────────────────────────────────────
  const { data: school, loading: schoolLoading, execute: loadSchool } = useApi(fetchSchoolProfile)
  const [schoolForm, setSchoolForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [schoolSaving, setSchoolSaving] = useState(false)
  const [schoolMsg, setSchoolMsg] = useState(null)

  useEffect(() => { if (user?.role === 'school_admin') loadSchool() }, [loadSchool, user])
  useEffect(() => {
    if (school) setSchoolForm({ name: school.name || '', email: school.email || '', phone: school.phone || '', address: school.address || '' })
  }, [school])

  const handleSchoolSave = async (e) => {
    e.preventDefault()
    setSchoolSaving(true); setSchoolMsg(null)
    try {
      await updateSchoolProfile(schoolForm)
      setSchoolMsg({ text: 'School profile updated successfully.', type: 'success' })
    } catch (err) {
      setSchoolMsg({ text: getErrorMessage(err), type: 'error' })
    } finally { setSchoolSaving(false) }
  }

  // ── Personal profile ──────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstName: user?.first_name || '', lastName: user?.last_name || '', phone: user?.phone || '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaving(true); setProfileMsg(null)
    try {
      await updateProfile({ firstName: profileForm.firstName, lastName: profileForm.lastName, phone: profileForm.phone })
      // Update localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const updated = { ...stored, first_name: profileForm.firstName, last_name: profileForm.lastName, phone: profileForm.phone }
      localStorage.setItem('user', JSON.stringify(updated))
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' })
    } catch (err) {
      setProfileMsg({ text: getErrorMessage(err), type: 'error' })
    } finally { setProfileSaving(false) }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' }); return
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters.', type: 'error' }); return
    }
    setPwSaving(true)
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwMsg({ text: 'Password changed successfully.', type: 'success' })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwMsg({ text: getErrorMessage(err), type: 'error' })
    } finally { setPwSaving(false) }
  }

  const setS = (f) => (e) => setSchoolForm((p) => ({ ...p, [f]: e.target.value }))
  const setP = (f) => (e) => setProfileForm((p) => ({ ...p, [f]: e.target.value }))
  const setPw = (f) => (e) => setPwForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your school profile, personal details and security." />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.filter((t) => t.id !== 'school' || user?.role === 'school_admin').map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── School Profile ─────────────────────────────────── */}
      {activeTab === 'school' && user?.role === 'school_admin' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900 mb-5">School Information</h2>
          {schoolLoading ? (
            <div className="flex items-center gap-3"><Spinner size="md" /><p className="text-sm text-gray-500">Loading…</p></div>
          ) : (
            <form onSubmit={handleSchoolSave} className="space-y-4">
              <Alert msg={schoolMsg?.text} type={schoolMsg?.type} />
              <FormField label="School Name" required>
                <Input value={schoolForm.name} onChange={setS('name')} placeholder="Greenfield Academy" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email">
                  <Input type="email" value={schoolForm.email} onChange={setS('email')} placeholder="school@email.com" />
                </FormField>
                <FormField label="Phone">
                  <Input type="tel" value={schoolForm.phone} onChange={setS('phone')} placeholder="+234 800 000 0000" />
                </FormField>
              </div>
              <FormField label="Address">
                <Input value={schoolForm.address} onChange={setS('address')} placeholder="School address" />
              </FormField>
              <div className="flex justify-end pt-2">
                <SaveBtn loading={schoolSaving} />
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Personal Profile ───────────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Alert msg={profileMsg?.text} type={profileMsg?.type} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <Input value={profileForm.firstName} onChange={setP('firstName')} placeholder="John" />
              </FormField>
              <FormField label="Last Name" required>
                <Input value={profileForm.lastName} onChange={setP('lastName')} placeholder="Doe" />
              </FormField>
            </div>
            <FormField label="Email">
              <Input type="email" value={user?.email || ''} disabled className="bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </FormField>
            <FormField label="Phone">
              <Input type="tel" value={profileForm.phone} onChange={setP('phone')} placeholder="+234 800 000 0000" />
            </FormField>
            <div className="flex justify-end pt-2">
              <SaveBtn loading={profileSaving} />
            </div>
          </form>
        </div>
      )}

      {/* ── Password ───────────────────────────────────────── */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Alert msg={pwMsg?.text} type={pwMsg?.type} />
            <FormField label="Current Password" required>
              <Input type="password" value={pwForm.currentPassword} onChange={setPw('currentPassword')} placeholder="••••••••" />
            </FormField>
            <FormField label="New Password" required>
              <Input type="password" value={pwForm.newPassword} onChange={setPw('newPassword')} placeholder="Min. 8 characters" />
            </FormField>
            <FormField label="Confirm New Password" required>
              <Input type="password" value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} placeholder="Repeat new password" />
            </FormField>
            <div className="flex justify-end pt-2">
              <SaveBtn loading={pwSaving} label="Change Password" />
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
