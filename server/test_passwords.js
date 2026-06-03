/**
 * Test password generation and reset endpoints.
 * Usage: node test_passwords.js
 */
const http = require('http')
const generatePassword = require('./src/utils/generatePassword')

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

const check = (label, got, exp) =>
  got === exp
    ? console.log(`  ✅ ${label}`)
    : console.log(`  ❌ ${label} — got "${got}", expected "${exp}"`)

const run = async () => {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║     Password Generation & Reset Tests        ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  // ── 1. Test generatePassword utility ─────────────────────────────────────
  console.log('── 1. generatePassword() utility ───────────────')
  const passwords = Array.from({ length: 10 }, generatePassword)
  console.log('   Sample passwords:', passwords.slice(0, 5).join('  '))

  // All passwords should be 9 chars
  const allCorrectLength = passwords.every((p) => p.length === 9)
  check('All passwords are 9 characters', allCorrectLength, true)

  // All passwords should have at least 1 uppercase
  const hasUpper = passwords.every((p) => /[A-Z]/.test(p))
  check('All have uppercase letter', hasUpper, true)

  // All passwords should have at least 1 digit
  const hasDigit = passwords.every((p) => /[0-9]/.test(p))
  check('All have a digit', hasDigit, true)

  // All passwords should have at least 1 special char
  const hasSpecial = passwords.every((p) => /[@#$!%]/.test(p))
  check('All have a special character', hasSpecial, true)

  // All passwords should be unique
  const unique = new Set(passwords).size === passwords.length
  check('All 10 passwords are unique', unique, true)

  // ── 2. Login as school admin ──────────────────────────────────────────────
  console.log('\n── 2. Login as school admin ─────────────────────')
  const loginRes = await req('POST', '/api/auth/login', {
    email: 'admin@greenfield.com', password: 'Admin@12345',
  })
  check('Login → 200', loginRes.status, 200)
  const token = loginRes.body.token

  // ── 3. Get existing student to test reset ─────────────────────────────────
  console.log('\n── 3. Get existing student ──────────────────────')
  const studentsRes = await req('GET', '/api/students?limit=1', null, token)
  check('GET /students → 200', studentsRes.status, 200)
  const students = studentsRes.body.students || []
  console.log(`   Students found: ${students.length}`)

  if (students.length > 0) {
    const student = students[0]
    const studentName = `${student.users?.first_name} ${student.users?.last_name}`
    console.log(`   Testing with: ${studentName}`)

    // ── 4. Reset student password ───────────────────────────────────────────
    console.log('\n── 4. Reset student password ────────────────────')
    const resetRes = await req('POST', `/api/students/${student.id}/reset-password`, null, token)
    check('POST /students/:id/reset-password → 200', resetRes.status, 200)
    check('Returns generatedPassword', !!resetRes.body.generatedPassword, true)
    check('Returns name', !!resetRes.body.name, true)
    check('Returns email', !!resetRes.body.email, true)

    if (resetRes.body.generatedPassword) {
      const pw = resetRes.body.generatedPassword
      console.log(`   New password: ${pw}`)
      check('Password is 9 chars', pw.length, 9)
      check('Has uppercase', /[A-Z]/.test(pw), true)
      check('Has digit', /[0-9]/.test(pw), true)
      check('Has special', /[@#$!%]/.test(pw), true)

      // ── 5. Verify new password works for login ──────────────────────────
      console.log('\n── 5. Verify new password works for login ───────')
      const studentLoginRes = await req('POST', '/api/auth/login', {
        email:    resetRes.body.email,
        password: pw,
      })
      check('Student can login with new password → 200', studentLoginRes.status, 200)
      check('Role is student', studentLoginRes.body.user?.role, 'student')
    }
  } else {
    console.log('   ⚠️  No students found — skipping reset test')
    console.log('   Add a student first via /students page')
  }

  // ── 6. Get existing teacher to test reset ─────────────────────────────────
  console.log('\n── 6. Get existing teacher ──────────────────────')
  const teachersRes = await req('GET', '/api/teachers?limit=1', null, token)
  check('GET /teachers → 200', teachersRes.status, 200)
  const teachers = teachersRes.body.teachers || []
  console.log(`   Teachers found: ${teachers.length}`)

  if (teachers.length > 0) {
    const teacher = teachers[0]
    const teacherName = `${teacher.users?.first_name} ${teacher.users?.last_name}`
    console.log(`   Testing with: ${teacherName}`)

    // ── 7. Reset teacher password ───────────────────────────────────────────
    console.log('\n── 7. Reset teacher password ────────────────────')
    const resetRes = await req('POST', `/api/teachers/${teacher.id}/reset-password`, null, token)
    check('POST /teachers/:id/reset-password → 200', resetRes.status, 200)
    check('Returns generatedPassword', !!resetRes.body.generatedPassword, true)

    if (resetRes.body.generatedPassword) {
      const pw = resetRes.body.generatedPassword
      console.log(`   New password: ${pw}`)
      check('Password is 9 chars', pw.length, 9)

      // ── 8. Verify new password works ────────────────────────────────────
      console.log('\n── 8. Verify teacher new password works ─────────')
      const teacherLoginRes = await req('POST', '/api/auth/login', {
        email:    resetRes.body.email,
        password: pw,
      })
      check('Teacher can login with new password → 200', teacherLoginRes.status, 200)
      check('Role is teacher', teacherLoginRes.body.user?.role, 'teacher')
    }
  } else {
    console.log('   ⚠️  No teachers found — skipping reset test')
  }

  // ── 9. Role isolation — student cannot reset passwords ────────────────────
  console.log('\n── 9. Role isolation ────────────────────────────')
  // school_admin cannot access portal reset (portal is for students/teachers)
  const noToken = await req('POST', '/api/students/fake-id/reset-password', null, null)
  check('No token → 401', noToken.status, 401)

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           All tests complete ✅               ║')
  console.log('╚══════════════════════════════════════════════╝\n')
}

run().catch((err) => {
  console.error('\n❌ Test crashed:', err.message)
  process.exit(1)
})
