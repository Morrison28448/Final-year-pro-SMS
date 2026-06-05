/**
 * Academic Year system smoke test.
 * Usage: node test_academic_year.js
 */
const http = require('http')

const req = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const r = http.request(
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

let passed = 0, failed = 0
const check = (label, got, exp) => {
  if (got === exp) { console.log(`  ✅ ${label}`); passed++ }
  else { console.log(`  ❌ ${label} — got ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`); failed++ }
}
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(45 - t.length)}`)

const run = async () => {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║   Academic Year System — Smoke Tests         ║')
  console.log('╚══════════════════════════════════════════════╝')

  // Login
  section('Auth')
  const login = await req('POST', '/api/auth/login', { email: 'admin@greenfield.com', password: 'Admin@12345' })
  check('Login → 200', login.status, 200)
  const tok = login.body.token

  // ── Academic Years ────────────────────────────────────────────────────────
  section('GET /api/academic-years')
  const getYears = await req('GET', '/api/academic-years', null, tok)
  check('GET years → 200', getYears.status, 200)
  check('Returns array', Array.isArray(getYears.body.years), true)
  console.log(`   Existing years: ${getYears.body.years?.length}`)

  // Create academic year with 2 terms, each with weighted assessments
  section('POST /api/academic-years')
  const createYear = await req('POST', '/api/academic-years', {
    name:      '_Test 2025/2026',
    startDate: '2025-09-01',
    endDate:   '2026-07-31',
    terms: [
      {
        name:       'First Semester',
        termNumber: 1,
        assessments: [
          { name: 'Mid-Semester',          weight: 30, maxScore: 100 },
          { name: 'End of Semester Exam',  weight: 70, maxScore: 100 },
        ],
      },
      {
        name:       'Second Semester',
        termNumber: 2,
        assessments: [
          { name: 'Class Test',     weight: 20, maxScore: 20 },
          { name: 'Mid-Semester',   weight: 30, maxScore: 100 },
          { name: 'Final Exam',     weight: 50, maxScore: 100 },
        ],
      },
    ],
  }, tok)
  check('POST → 201', createYear.status, 201)
  check('Year name correct', createYear.body.year?.name, '_Test 2025/2026')
  check('2 terms created', createYear.body.year?.terms?.length, 2)
  const yearId = createYear.body.year?.id
  const firstTerm = createYear.body.year?.terms?.[0]
  const secondTerm = createYear.body.year?.terms?.[1]
  console.log(`   Year ID: ${yearId?.slice(0, 8)}…`)
  console.log(`   First semester: ${firstTerm?.name} — ${firstTerm?.assessments?.length} assessments, total ${firstTerm?.total_weight}%`)
  console.log(`   Second semester: ${secondTerm?.name} — ${secondTerm?.assessments?.length} assessments, total ${secondTerm?.total_weight}%`)
  check('First semester weight = 100', firstTerm?.total_weight, 100)
  check('Second semester weight = 100', secondTerm?.total_weight, 100)

  // Weight validation
  section('Validation — weights ≠ 100')
  const badYear = await req('POST', '/api/academic-years', {
    name: '_Bad',
    terms: [{ name: 'T1', termNumber: 1, assessments: [{ name: 'X', weight: 60, maxScore: 100 }] }],
  }, tok)
  check('Weights ≠ 100 → 400', badYear.status, 400)
  console.log(`   Error: ${badYear.body.message}`)

  // GET by ID
  section('GET /api/academic-years/:id')
  const getById = await req('GET', `/api/academic-years/${yearId}`, null, tok)
  check('GET by ID → 200', getById.status, 200)
  check('Correct name', getById.body.year?.name, '_Test 2025/2026')
  check('Has 2 terms', getById.body.year?.terms?.length, 2)

  // Set active
  section('PUT — set active')
  const setActive = await req('PUT', `/api/academic-years/${yearId}`, { isActive: true }, tok)
  check('Set active → 200', setActive.status, 200)
  check('is_active = true', setActive.body.year?.is_active, true)

  // Enrol students
  section('POST — enrol students')
  const enrol = await req('POST', `/api/academic-years/${yearId}/enrol`, null, tok)
  check('Enrol → 200', enrol.status, 200)
  console.log(`   Students enrolled: ${enrol.body.enrolled}`)

  // GET student records for year
  section('GET — student records for year')
  const records = await req('GET', `/api/academic-years/${yearId}/students`, null, tok)
  check('GET students → 200', records.status, 200)
  check('Returns array', Array.isArray(records.body.records), true)
  console.log(`   Records: ${records.body.records?.length}`)

  // Class levels
  section('GET /api/academic-years/class-levels')
  const getLevels = await req('GET', '/api/academic-years/class-levels', null, tok)
  check('GET class levels → 200', getLevels.status, 200)
  check('Returns array', Array.isArray(getLevels.body.levels), true)
  console.log(`   Existing levels: ${getLevels.body.levels?.length}`)

  // Terms endpoint still works
  section('GET /api/terms (with academic year data)')
  const terms = await req('GET', '/api/terms', null, tok)
  check('GET /terms → 200', terms.status, 200)
  check('Returns array', Array.isArray(terms.body.terms), true)
  console.log(`   Total terms: ${terms.body.terms?.length}`)

  // Role isolation
  section('Role isolation')
  const noAuth = await req('GET', '/api/academic-years', null, null)
  check('No token → 401', noAuth.status, 401)
  const superAdmin = await req('POST', '/api/auth/login', { email: 'superadmin@sms.com', password: 'SuperAdmin@123' })
  const saOnYears  = await req('GET', '/api/academic-years', null, superAdmin.body.token)
  check('super_admin on /academic-years → 403', saOnYears.status, 403)

  // Cleanup
  section('Cleanup')
  const del = await req('DELETE', `/api/academic-years/${yearId}`, null, tok)
  check('DELETE year → 200', del.status, 200)
  const gone = await req('GET', `/api/academic-years/${yearId}`, null, tok)
  check('Deleted year → 404', gone.status, 404)

  console.log(`\n╔══════════════════════════════════════════════╗`)
  console.log(`║  Results: ${passed} passed, ${failed} failed${' '.repeat(22 - String(passed + failed).length)}║`)
  console.log(`╚══════════════════════════════════════════════╝\n`)
  if (failed > 0) process.exit(1)
}

run().catch((err) => { console.error('\n❌ Crashed:', err.message); process.exit(1) })
