export const ROLES = {
  SUPER_ADMIN:  'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  TEACHER:      'teacher',
  STUDENT:      'student',
  PARENT:       'parent',
}

export const ROLE_LABELS = {
  super_admin:  'Super Admin',
  school_admin: 'School Admin',
  teacher:      'Teacher',
  student:      'Student',
  parent:       'Parent',
}

// Dashboard home route per role
export const ROLE_HOME = {
  super_admin:  '/super-admin/dashboard',
  school_admin: '/dashboard',
  teacher:      '/dashboard',
  student:      '/dashboard',
  parent:       '/dashboard',
}

/** Default landing page for unauthenticated users */
export const PUBLIC_HOME = '/'

/** Super admin login (not linked from public portal) */
export const SUPER_ADMIN_LOGIN = '/super-admin/login'

/** Sidebar paths gated by school module toggles */
export const MODULE_ROUTES = {
  attendance: ['/attendance', '/parent/attendance'],
  exams:      ['/exams', '/exams/terms', '/exams/entry', '/exams/report', '/parent/results'],
}

export const ROLE_LABELS_SETTINGS_TAB = {
  school_admin: 'school',
  super_admin:  'personal',
  teacher:      'personal',
  student:      'personal',
  parent:       'personal',
}
