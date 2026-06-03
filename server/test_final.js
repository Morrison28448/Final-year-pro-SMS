/**
 * Final comprehensive API test.
 * Tests all major route groups and the portal flow.
 * Usage: node test_final.js
 */
const http = require('https')
const httpPlain = require('http')

const req = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const r = httpPlain.request(
      {
        hostname: 'localhost', port: 5000, path, method,
        headers: {
          ...(payload && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
          catch { resolve({ status: res.statusCode, body: data }) }
        })
      }
    )
    r.on('error', reject)
    if (payload) r.write(payload)
    r.end()
  })

const pass = (label) => console.log(`  ✅ ${label}`)
const fail = (label, got, exp) => console.log(`  ❌ ${label} — got ${got}, expected ${exp}`)
const check = (label, got, exp) => got === exp ? pass(label) : fail(label, got, exp)
const section = (title) => console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 44 - title.length))}`)

const run = async () => {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║     SMS Platform — Final API Test Suite      ║')
  console.log('╚══════════════════════════════════════════════╝')

  // ── 1. Health ─────────────────────────────────────────────────────────────
  section('Health')
  const health = await req('GET', '/api/health')
  check('GET /api/health → 200', health.status, 200)
  check('success: true', health.body.success, true)

  // ── 2. School search (public) ─────────────────────────────────────────────
  section('Public school search')
  const schools = await req('GET', '/api/auth/schools?search=green')
  check('GET /api/auth/schools → 200', schools.status, 200)
  check('Returns array', Array.isArray(schools.body.schools), true)
  console.log(`   Found: ${schools.body.schools?.length} school(s) matching "green"`)

  // ── 3. Super admin login ──────────────────────────────────────────────────
  section('Super Admin auth')
  const saLogin = await req('POST', '/api/auth/login', { email: 'superadmin@sms.com', password: 'SuperAdmin@123' })
  check('Login → 200', saLogin.status, 200)
  check('Role: super_admin', saLogin.body.user?.role, 'super_admin')
  const saToken = saLogin.body.token

  const saStats = await req('GET', '/api/super-admin/stats', null, saToken)
  check('GET /super-admin/stats → 200', saStats.status, 200)

  const saSchools = await req('GET', '/api/super-admin/schools', null, saToken)
  check('GET /super-admin/schools → 200', saSchools.status, 200)
  console.log(`   Total schools: ${saSchools.body.pagination?.total}`)

  // ── 4. School admin login ─────────────────────────────────────────────────
  section('School Admin auth')
  const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@greenfield.com', password: 'Admin@12345' })
  check('Login → 200', adminLogin.status, 200)
  check('Role: school_admin', adminLogin.body.user?.role, 'school_admin')
  check('School name present', !!adminLogin.body.user?.school_name, true)
  const adminToken = adminLogin.body.token
  console.log(`   School: ${adminLogin.body.user?.school_name}`)

  // ── 5. School admin dashboard ─────────────────────────────────────────────
  section('School Admin dashboard')
  const dashStats = await req('GET', '/api/school-admin/stats', null, adminToken)
  check('GET /school-admin/stats → 200', dashStats.status, 200)
  check('Has students', 'students' in (dashStats.body.stats || {}), true)

  const modules = await req('GET', '/api/school-admin/modules', null, adminToken)
  check('GET /school-admin/modules → 200', modules.status, 200)
  check('Returns 4 modules', modules.body.modules?.length, 4)

  // ── 6. Students ───────────────────────────────────────────────────────────
  section('Students')
  const students = await req('GET', '/api/students', null, adminToken)
  check('GET /students → 200', students.status, 200)
  check('Has students array', Array.isArray(students.body.students), true)
  console.log(`   Total students: ${students.body.pagination?.total}`)

  const classes = await req('GET', '/api/students/classes', null, adminToken)
  check('GET /students/classes → 200', classes.status, 200)

  // ── 7. Teachers ───────────────────────────────────────────────────────────
  section('Teachers')
  const teachers = await req('GET', '/api/teachers', null, adminToken)
  check('GET /teachers → 200', teachers.status, 200)
  check('Has teachers array', Array.isArray(teachers.body.teachers), true)
  console.log(`   Total teachers: ${teachers.body.pagination?.total}`)

  // ── 8. Academics ──────────────────────────────────────────────────────────
  section('Academics (Classes + Subjects)')
  const acadClasses = await req('GET', '/api/academics/classes', null, adminToken)
  check('GET /academics/classes → 200', acadClasses.status, 200)
  console.log(`   Classes: ${acadClasses.body.classes?.length}`)

  const acadSubjects = await req('GET', '/api/academics/subjects', null, adminToken)
  check('GET /academics/subjects → 200', acadSubjects.status, 200)
  console.log(`   Subjects: ${acadSubjects.body.subjects?.length}`)

  // ── 9. Attendance ─────────────────────────────────────────────────────────
  section('Attendance')
  const attClasses = await req('GET', '/api/attendance/classes', null, adminToken)
  check('GET /attendance/classes → 200', attClasses.status, 200)

  const attStats = await req('GET', '/api/attendance/stats', null, adminToken)
  check('GET /attendance/stats → 200', attStats.status, 200)
  check('Has summary', !!attStats.body.stats?.summary, true)

  const attRecords = await req('GET', '/api/attendance', null, adminToken)
  check('GET /attendance → 200', attRecords.status, 200)

  // ── 10. Exams ─────────────────────────────────────────────────────────────
  section('Exams')
  const exams = await req('GET', '/api/exams', null, adminToken)
  check('GET /exams → 200', exams.status, 200)
  console.log(`   Total exams: ${exams.body.exams?.length}`)

  // ── 11. Subscriptions ─────────────────────────────────────────────────────
  section('Subscriptions (demo mode)')
  const sub = await req('GET', '/api/subscriptions', null, adminToken)
  check('GET /subscriptions → 200', sub.status, 200)
  check('Has plans array', Array.isArray(sub.body.plans), true)
  check('3 plans available', sub.body.plans?.length, 3)
  console.log(`   Current plan: ${sub.body.subscription?.plan_name || 'None'}`)

  // Subscribe to basic plan
  const subInit = await req('POST', '/api/subscriptions/initialize', { planKey: 'basic' }, adminToken)
  check('POST /subscriptions/initialize → 200', subInit.status, 200)
  check('Subscription activated', subInit.body.subscription?.status, 'active')
  check('Plan name correct', subInit.body.subscription?.plan_name, 'Basic')
  console.log(`   Reference: ${subInit.body.reference}`)

  // ── 12. Settings ──────────────────────────────────────────────────────────
  section('Settings')
  const schoolProfile = await req('GET', '/api/settings/school', null, adminToken)
  check('GET /settings/school → 200', schoolProfile.status, 200)
  check('Has school name', !!schoolProfile.body.school?.name, true)

  // ── 13. Portal — school search ────────────────────────────────────────────
  section('Portal — school search')
  const portalSchools = await req('GET', '/api/auth/schools?search=greenfield')
  check('GET /auth/schools → 200', portalSchools.status, 200)
  check('Greenfield found', portalSchools.body.schools?.length > 0, true)
  console.log(`   Schools found: ${portalSchools.body.schools?.map((s) => s.name).join(', ')}`)

  // ── 14. Portal — role isolation ───────────────────────────────────────────
  section('Portal — role isolation')
  // super_admin cannot access portal routes
  const portalMe = await req('GET', '/api/portal/me', null, saToken)
  check('super_admin on /portal/me → 403', portalMe.status, 403)

  // school_admin cannot access portal routes
  const adminPortal = await req('GET', '/api/portal/me', null, adminToken)
  check('school_admin on /portal/me → 403', adminPortal.status, 403)

  // No token → 401
  const noToken = await req('GET', '/api/portal/me', null, null)
  check('No token → 401', noToken.status, 401)

  // ── 15. Role isolation summary ────────────────────────────────────────────
  section('Cross-role isolation')
  const teacherOnAdmin = await req('GET', '/api/school-admin/stats', null, saToken)
  check('super_admin on school-admin routes → 403', teacherOnAdmin.status, 403)

  const adminOnSuper = await req('GET', '/api/super-admin/stats', null, adminToken)
  check('school_admin on super-admin routes → 403', adminOnSuper.status, 403)

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           All tests complete ✅               ║')
  console.log('╚══════════════════════════════════════════════╝\n')
}

run().catch((err) => {
  console.error('\n❌ Test suite crashed:', err.message)
  process.exit(1)
})
