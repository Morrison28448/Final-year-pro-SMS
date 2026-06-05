import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/ui/icons'

/**
 * ExamsPage — gateway into the terms-based exam system.
 * School admins manage terms & assessments.
 * Teachers go directly to score entry.
 */
const ExamsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'school_admin'

  const CARDS = isAdmin
    ? [
        {
          to:    '/exams/terms',
          title: 'Terms & Assessments',
          desc:  'Create academic terms, define assessment components with custom weights (e.g. Midterm 30%, Final 70%), and manage the full exam structure.',
          icon:  Icons.BookOpen,
          accent: 'bg-gray-900 text-white',
          cta:    'Manage Terms',
        },
        {
          to:    '/exams/entry',
          title: 'Score Entry',
          desc:  'Select a term, assessment, class and subject to enter student scores. Download a CSV template or upload filled scores in bulk.',
          icon:  Icons.ClipboardList,
          accent: 'bg-blue-50 text-blue-600',
          cta:    'Enter Scores',
        },
        {
          to:    '/exams/report',
          title: 'Terminal Reports',
          desc:  'View weighted terminal scores per student per subject. See class rankings, averages and grade breakdowns. Print-ready.',
          icon:  Icons.ChartBar,
          accent: 'bg-emerald-50 text-emerald-600',
          cta:    'View Reports',
        },
      ]
    : [
        {
          to:    '/exams/entry',
          title: 'Enter Scores',
          desc:  'Select an assessment, your class and subject. Enter scores for each student or upload a filled CSV template.',
          icon:  Icons.ClipboardList,
          accent: 'bg-gray-900 text-white',
          cta:    'Open Score Entry',
        },
        {
          to:    '/exams/report',
          title: 'View Terminal Reports',
          desc:  'See how your students performed across all assessments in a term. Weighted scores, grades and class rankings.',
          icon:  Icons.ChartBar,
          accent: 'bg-blue-50 text-blue-600',
          cta:    'View Reports',
        },
      ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Exams</p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Exams & Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isAdmin
            ? 'Create terms, configure assessment weights, enter scores and generate terminal reports.'
            : 'Enter student scores and view weighted terminal results.'}
        </p>
      </div>

      {/* How it works — for context */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step:  '01',
              label: isAdmin ? 'Admin creates a Term' : 'Admin sets up a Term',
              desc:  'e.g. "First Semester 2025/2026" with assessment components: Class Test (10%), Midterm (30%), Final Exam (60%)',
            },
            {
              step:  '02',
              label: 'Teachers enter scores',
              desc:  'Each teacher selects their class and subject, then enters raw scores for each student — one by one or via CSV upload.',
            },
            {
              step:  '03',
              label: 'Terminal score computed',
              desc:  'System calculates weighted terminal score: (10/100×10%) + (midterm×30%) + (final×60%) = final grade.',
            },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {CARDS.map(({ to, title, desc, icon: IconComp, accent, cta }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
              <IconComp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">{title}</p>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              {cta}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ExamsPage
