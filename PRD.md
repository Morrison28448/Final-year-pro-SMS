# Product Requirements Document
## EduFlow — SaaS School Management System

**Version:** 1.0.0
**Date:** June 2026
**Status:** In Development

---

## 1. Executive Summary

EduFlow is a multi-tenant, subscription-based School Management System (SMS) designed for educational institutions across Africa. The platform enables schools to digitise and centralise their academic operations — student enrolment, attendance, examinations, results, and billing — through a single, role-aware web application.

The system targets school administrators, teachers, students, and parents, each with a purpose-built interface accessible via a public portal. A Super Admin layer manages the entire platform, including school onboarding and subscription oversight.

---

## 2. Problem Statement

Most African schools rely on paper-based or fragmented digital systems for daily operations. This leads to:

- Lost or inaccurate attendance and result records
- No visibility for parents into their child's academic progress
- Slow, error-prone fee and subscription collection
- Inability to scale administrative workflows as student populations grow

EduFlow solves this by providing a single, affordable, always-available platform purpose-built for the African school context.

---

## 3. Goals and Objectives

| Goal | Metric |
|---|---|
| Reduce attendance marking time | < 2 minutes per class per day |
| Centralise student records | 100% digital, zero paper dependency |
| Enable parent visibility | Real-time access to attendance and results |
| Simplify billing | One-click subscription activation |
| Scale across schools | Multi-tenant isolation, one deployment |

---

## 4. Target Users

### 4.1 Super Admin
- Platform operator (single account)
- Manages all schools, subscriptions, and platform health
- Access: Full platform — schools, users, billing, analytics

### 4.2 School Admin
- Principal or administrator of a specific school
- Manages staff, students, classes, subjects, and modules
- Access: Their school only — full CRUD on all school data

### 4.3 Teacher
- Teaching staff assigned to one or more classes
- Marks attendance, enters exam scores, views their class rosters
- Access: Their assigned classes and students only

### 4.4 Student
- Enrolled in a specific school and class
- Views their own attendance records and exam results
- Access: Read-only view of their own data

### 4.5 Parent
- Guardian of one or more enrolled students
- Views their child's attendance and results
- Access: Read-only view of linked student's data

---

## 5. System Architecture

### 5.1 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Backend | Node.js, Express 5 |
| Database | Supabase (PostgreSQL) |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Payments | Paystack (demo mode in development) |
| Deployment | Separate client/server deployments |

### 5.2 Architecture Principles

- **Multi-tenant:** Each school's data is isolated by `school_id` on every table. No school can access another school's data.
- **Role-based access control (RBAC):** Every API route is protected by JWT verification and role restriction middleware.
- **RESTful API:** Clean resource-based URLs, consistent JSON response shape `{ success, message, data }`.
- **Modular frontend:** Feature-based folder structure; reusable UI component library; hooks for data fetching.
- **Module toggle system:** School admins can enable/disable individual feature modules (attendance, exams, library, transport) per school.

### 5.3 Database Schema (Key Tables)

```
schools          — school profile, active status
users            — all user accounts (all roles), school_id FK
students         — student profiles linked to users
teachers         — teacher profiles linked to users
classes          — classes per school
subjects         — subjects per school
class_subjects   — many-to-many: classes ↔ subjects ↔ teachers
attendance       — daily attendance records per student
exams            — exam definitions per class
results          — exam scores per student per subject
subscriptions    — billing records per school
school_modules   — toggleable feature flags per school
```

---

## 6. Feature Specifications

### 6.1 Authentication

| Feature | Description |
|---|---|
| Landing page | Animated homepage with school search (live API) |
| School search | Debounced real-time search of active schools |
| Role selection | After school is selected, user picks their role |
| Login | Email + password, JWT issued on success |
| Portal | `/portal` — dedicated entry for teachers, students, parents |
| Admin login | `/super-admin/login` — separate, unlinked from portal |
| Auto-generated passwords | On student/teacher creation, system generates a secure 9-char password |
| Password reset | School admin can reset any student or teacher's password; new password shown once |
| JWT expiry | 7 days (configurable via `JWT_EXPIRES_IN`) |

**Password generation rules:**
- 9 characters
- At least 1 uppercase letter
- At least 1 digit
- At least 1 special character (@, #, $, !, %)
- No ambiguous characters (0, 1, I, l, O)

### 6.2 Super Admin Dashboard

| Feature | Description |
|---|---|
| Platform stats | Total schools, active subscriptions, total revenue, total users |
| School health chart | Donut chart — active / inactive / expired breakdown |
| Subscription breakdown | Horizontal bar chart per subscription status |
| Revenue card | Total revenue from active subscriptions (NGN) |
| Schools table | Paginated list with search, subscription status, activate/deactivate toggle |
| Navigation cards | Quick links to Schools, Users, Billing management |

### 6.3 School Admin Dashboard

| Feature | Description |
|---|---|
| School metrics | Students, teachers, classes, subjects counts |
| Today's attendance | Stacked progress bar with present / late / absent breakdown |
| Activity feed | Recent student enrolments and teacher additions |
| Module management | Toggle cards for attendance, exams, library, transport |
| Quick access grid | Direct links to all major features |

### 6.4 Student Management

| Feature | Description |
|---|---|
| Student list | Paginated, searchable by name / email / admission number |
| Add student | Multi-section form: personal, academic, guardian info |
| Auto-password | System generates secure password, shown once to admin |
| Edit student | Update profile and class assignment |
| Delete student | Removes student profile + user account |
| Assign class | Dropdown to move student between classes |
| Reset password | Admin generates new password for any student |

### 6.5 Teacher Management

| Feature | Description |
|---|---|
| Teacher list | Paginated, searchable by name / email / employee ID |
| Add teacher | Form: name, email, phone, employee ID, qualification, specialization |
| Auto-password | Same password generation as students |
| Edit teacher | Update any profile field |
| Delete teacher | Removes teacher profile + user account |
| Reset password | Admin generates new password for any teacher |

### 6.6 Academics (Classes & Subjects)

| Feature | Description |
|---|---|
| Class management | Create, edit, delete classes with optional section |
| Subject management | Create, edit, delete subjects with optional code |
| Subject assignment | Assign any combination of subjects to a class |
| Class list view | Shows student count and assigned subjects per class |

### 6.7 Attendance System

| Feature | Description |
|---|---|
| Mark attendance | Select class + date → load all students → mark present/absent/late per student |
| Bulk mark | "All Present" / "All Absent" quick-mark buttons |
| Remarks | Optional per-student note for each attendance entry |
| Edit attendance | Update an already-marked session |
| Attendance records | Paginated, filterable by class and date |
| Statistics | Summary (total, present, absent, late, rate) + daily trend chart (last 30 days) |
| Student report | Individual attendance history with summary stats |

**Constraint note:** The attendance table uses a fetch-then-insert/update strategy to avoid dependency on a `UNIQUE` constraint on `(school_id, student_id, attendance_date)`. Adding this constraint in Supabase is recommended.

### 6.8 Exams & Results

The exam system is built around **Terms** (academic periods) with configurable weighted **Assessment Components**. This replaces the old flat single-exam model.

#### Term Management (School Admin)

| Feature | Description |
|---|---|
| Create Term | Define a term (e.g. "First Semester 2025/2026") with an academic year |
| Assessment components | Each term has multiple weighted components that must sum to exactly 100% |
| Example weights | Class Exercises 10% + Midterm 30% + Final Exam 60% = 100% |
| Max score per component | Configurable per assessment (e.g. class test out of 10, exam out of 100) |
| Edit / Delete term | Full CRUD; deleting a term cascades to all assessment scores |
| Active toggle | Mark a term as active/inactive |

#### Score Entry (Teacher + School Admin)

| Feature | Description |
|---|---|
| Selector flow | Choose: Assessment → Class → Subject |
| Pre-filled sheet | Students in the class load with existing scores pre-filled |
| Manual entry | Enter scores one by one in a table — live grade shown as you type |
| CSV template download | Download a CSV with student names/admission numbers and blank score column |
| CSV upload | Upload filled CSV — system maps by admission number, shows warnings for unknowns |
| Save scores | Scores stored against `term_assessment_id` + `subject_id` + `student_id` |

#### Terminal Report (Teacher + School Admin)

| Feature | Description |
|---|---|
| Weighted terminal score | `terminal = Σ (raw_score / max_score × weight)` per subject per student |
| Auto grade | Computed from terminal percentage (A+ ≥ 90, A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50, F < 50) |
| Class ranking | Students sorted by average terminal score |
| Per-column breakdown | Each assessment column shown alongside the weighted terminal total |
| Class statistics | Class average, highest, lowest, total students |
| Print-ready | Browser print button on report page |

#### Data model additions

```sql
-- terms: academic period with metadata
terms ( id, school_id, name, academic_year, is_active, created_at )

-- term_assessments: weighted components within a term
term_assessments ( id, school_id, term_id, name, weight, max_score, sort_order )

-- results: existing table, now includes term_assessment_id (nullable for backward compat)
results.term_assessment_id → term_assessments.id
```

#### Required SQL migration (run in Supabase SQL Editor)

```sql
CREATE TABLE terms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  academic_year varchar(20),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE term_assessments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  weight numeric(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  max_score numeric(5,2) NOT NULL DEFAULT 100,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS term_assessment_id uuid REFERENCES term_assessments(id) ON DELETE SET NULL;

CREATE INDEX idx_terms_school ON terms(school_id);
CREATE INDEX idx_term_assessments_term ON term_assessments(term_id);
CREATE INDEX idx_results_term_assessment ON results(term_assessment_id);

CREATE TRIGGER update_terms_updated_at
  BEFORE UPDATE ON terms FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.9 Subscription & Billing

| Feature | Description |
|---|---|
| Plans | Basic (₦15,000/mo), Standard (₦35,000/mo), Premium (₦75,000/mo) |
| Demo mode | Subscriptions activate instantly without payment gateway (dev/test) |
| Paystack integration | Ready for production — swap `initializePayment` service function |
| Subscription history | Table of all past/current subscription records |
| Expiry warning | Banner shown when ≤ 7 days remain |
| Auto-activate school | School `is_active` set to `true` on successful payment |

### 6.10 Module Toggle System

Schools can enable or disable the following modules:

| Module | Affects |
|---|---|
| `attendance` | Attendance marking and reporting routes |
| `exams` | Exam creation and result entry routes |
| `library` | (Planned) Library management |
| `transport` | (Planned) Transport management |

Disabled modules are hidden from the sidebar and return 403 if accessed directly.

### 6.11 Student Portal

| Feature | Description |
|---|---|
| Attendance summary | Present / absent / late counts + radial gauge showing rate |
| Attendance log | Last 10 attendance records in a clean table |
| Exam results | Score bars per subject per exam, with tab switcher for multiple exams |
| Subjects | List of assigned subjects with teacher name and subject code |

### 6.12 Teacher Portal

| Feature | Description |
|---|---|
| Class selector | Click a class to view its subjects and filter students |
| Student roster | All students in selected class with deterministic avatar colors |
| Attendance stats | Stacked bar chart with present / late / absent breakdown |
| Quick actions | Cards for Mark Attendance, Enter Results, View Students, Settings |

### 6.13 Settings

| Feature | Description |
|---|---|
| School profile | Update name, email, phone, address (school admin only) |
| Personal profile | Update name and phone for any logged-in user |
| Change password | Current password verification + new password with 8-char minimum |

---

## 7. API Reference (Summary)

All endpoints are prefixed with `/api`.

| Group | Base Path | Roles |
|---|---|---|
| Auth | `/auth` | Public |
| Super Admin | `/super-admin` | `super_admin` |
| School Admin | `/school-admin` | `school_admin` |
| Students | `/students` | `school_admin`, `teacher` |
| Teachers | `/teachers` | `school_admin` |
| Academics | `/academics` | `school_admin`, `teacher` |
| Attendance | `/attendance` | `school_admin`, `teacher` |
| Exams (legacy) | `/exams` | `school_admin`, `teacher` |
| Terms | `/terms` | `school_admin`, `teacher` |
| Subscriptions | `/subscriptions` | `school_admin` |
| Settings | `/settings` | All authenticated |
| Portal | `/portal` | `teacher`, `student`, `parent` |

### Key Endpoints

```
GET    /api/auth/schools              — Public school search (for landing page)
POST   /api/auth/login                — All roles
POST   /api/auth/register             — Create school + school_admin

POST   /api/students/:id/reset-password   — Reset student password
POST   /api/teachers/:id/reset-password   — Reset teacher password

POST   /api/attendance/mark           — Bulk mark attendance for a class
GET    /api/attendance/sheet          — Pre-filled mark sheet
GET    /api/attendance/stats          — Summary + daily trend

GET    /api/exams/:id/sheet           — Pre-filled result entry sheet
POST   /api/exams/:id/results         — Save/update exam results

GET    /api/terms                     — List all terms for a school
POST   /api/terms                     — Create term with weighted assessments
GET    /api/terms/:id                 — Get term with assessments
PUT    /api/terms/:id                 — Update term metadata
DELETE /api/terms/:id                 — Delete term + all scores
GET    /api/terms/:id/report?classId  — Terminal report for a class

GET    /api/terms/assessment/:id/sheet?classId&subjectId   — Score entry sheet
POST   /api/terms/assessment/:id/scores                    — Save scores
GET    /api/terms/assessment/:id/template?classId&subjectId — Download CSV template
POST   /api/terms/assessment/:id/upload                    — Upload filled CSV

POST   /api/subscriptions/initialize  — Activate subscription (demo / Paystack)
POST   /api/subscriptions/webhook     — Paystack webhook handler

GET    /api/portal/me                 — Resolve user → student/teacher profile
GET    /api/portal/my-attendance      — Student's own attendance
GET    /api/portal/my-results         — Student's own results
GET    /api/portal/my-timetable       — Student's subjects + teachers
GET    /api/portal/my-classes         — Teacher's assigned classes
GET    /api/portal/my-students        — Students in teacher's classes
```

---

## 8. Non-Functional Requirements

### 8.1 Security
- All routes except `/auth/login`, `/auth/register`, `/auth/schools` are protected by JWT
- Passwords hashed with bcrypt (cost factor 12)
- Service role key never exposed to the client
- School data isolation enforced at the service layer (`school_id` filter on every query)
- `.env` excluded from version control

### 8.2 Performance
- Supabase connection verified on server startup; process exits if credentials fail
- Pagination on all list endpoints (default 10–20 items)
- Attendance and results use fetch-then-insert/update (no upsert constraint dependency)
- Frontend uses `useApi` hook with loading/error state; no redundant fetches

### 8.3 Usability
- Fully responsive (mobile-first Tailwind CSS)
- Role-aware sidebar — each role sees only their relevant navigation
- Disabled module routes hidden from UI and blocked at API level
- Password reveal modal shown once after creation/reset with copy-to-clipboard
- Landing page with animated school search — no login URL to memorise

### 8.4 Scalability
- Multi-tenant by design — adding a new school requires zero code changes
- Module toggle system allows feature flags per school without redeployment
- Stateless JWT authentication — horizontally scalable

---

## 9. Seed Data (Development)

Run these scripts in `server/` to populate test data:

```bash
# Create super admin account
npm run seed:admin
# Credentials: superadmin@sms.com / SuperAdmin@123

# Create a test school + school admin
npm run seed:school
# Credentials: admin@greenfield.com / Admin@12345
# School: Greenfield Academy
```

---

## 10. Deployment Notes

### Environment Variables (server/.env)

```
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=<project_url>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
JWT_SECRET=<min_64_char_random_string>
JWT_EXPIRES_IN=7d
PAYSTACK_SECRET_KEY=<paystack_secret>    # leave blank for demo mode
```

### Production Checklist

- [ ] Replace demo billing with live Paystack `initializePayment` flow
- [ ] Add `UNIQUE` constraint: `attendance(school_id, student_id, attendance_date)`
- [ ] Add `UNIQUE` constraint: `results(school_id, exam_id, student_id, subject_id)`
- [ ] Enable Row Level Security (RLS) on Supabase tables
- [ ] Set `NODE_ENV=production` to suppress stack traces in error responses
- [ ] Configure CORS `CLIENT_URL` to production frontend domain
- [ ] Set up Paystack webhook endpoint verification with `PAYSTACK_SECRET_KEY`
- [ ] Run `npm run build` in `client/` and serve from CDN or static host

---

## 11. Known Limitations (v1.0)

| Limitation | Planned Resolution |
|---|---|
| Parent portal is a stub | Full parent dashboard in v1.1 |
| Library module toggle exists but no library feature | v1.2 |
| Transport module toggle exists but no transport feature | v1.2 |
| No email notifications (password reset, results published) | v1.1 with SendGrid/Resend |
| No file uploads (profile photos, school logo) | v1.1 with Supabase Storage |
| No real-time updates | v1.2 with Supabase Realtime |
| Single-currency billing (NGN) | Multi-currency in v1.2 |
| No student/parent self-registration | By design — admin controls all accounts |

---

## 12. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | June 2026 | Initial release — core platform complete |

---

*This document reflects the current implemented state of EduFlow v1.0.0.*
