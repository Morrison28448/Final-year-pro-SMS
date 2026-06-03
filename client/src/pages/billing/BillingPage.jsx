import { useEffect, useState } from 'react'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import Badge         from '../../components/ui/Badge'
import Spinner       from '../../components/ui/Spinner'
import {
  fetchSubscription,
  initializePayment,
  fetchPaymentHistory,
} from '../../services/subscription.service'
import { formatDate, getErrorMessage } from '../../utils/helpers'

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount || 0)

const statusVariant = (status) => {
  const map = { active: 'success', inactive: 'neutral', expired: 'warning', cancelled: 'danger' }
  return map[status] || 'neutral'
}

const daysLeft = (endDate) => {
  if (!endDate) return null
  const diff = new Date(endDate) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── Plan card ─────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, current, onSelect, loading }) => {
  const isCurrentPlan =
    current?.plan_name?.toLowerCase() === plan.name.toLowerCase() &&
    current?.status === 'active'

  return (
    <div className={`bg-white rounded-xl border-2 p-5 flex flex-col gap-3 transition
      ${isCurrentPlan ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
    >
      {isCurrentPlan && (
        <span className="self-start px-2.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
          Current Plan
        </span>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
      </div>

      {/* Features */}
      {plan.features && (
        <ul className="space-y-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-green-500 font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-2">
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(plan.amount)}
          <span className="text-sm font-normal text-gray-500"> / month</span>
        </p>
      </div>

      <button
        onClick={() => onSelect(plan.key)}
        disabled={loading || isCurrentPlan}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition
          ${isCurrentPlan
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
          }`}
      >
        {loading
          ? <Spinner size="sm" className="mx-auto border-white border-t-transparent" />
          : isCurrentPlan
          ? '✓ Active'
          : `Subscribe to ${plan.name}`}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const BillingPage = () => {
  const {
    data:    subData,
    loading: subLoading,
    execute: loadSubscription,
  } = useApi(fetchSubscription)

  const {
    data:    history,
    loading: historyLoading,
    execute: loadHistory,
  } = useApi(fetchPaymentHistory, [])

  const [payLoading, setPayLoading] = useState(false)
  const [toast, setToast]           = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => {
    loadSubscription()
    loadHistory()
  }, [loadSubscription, loadHistory])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Handle plan selection — instant activation (demo mode) ───────────────
  const handleSelectPlan = async (planKey) => {
    setPayLoading(true)
    setError('')
    try {
      const result = await initializePayment(planKey)
      showToast(`🎉 ${result.message || `Subscribed to ${result.plan?.name} plan successfully!`}`)
      // Reload subscription and history to reflect new state
      loadSubscription()
      loadHistory()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPayLoading(false)
    }
  }

  const subscription = subData?.subscription
  const plans        = subData?.plans || []
  const remaining    = daysLeft(subscription?.end_date)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your school's subscription plan."
      />

      {/* ── Demo mode banner ────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <span className="text-lg shrink-0">🧪</span>
        <div>
          <p className="font-semibold">Demo Mode</p>
          <p className="text-xs mt-0.5 text-yellow-700">
            Subscriptions are activated instantly without payment. Paystack integration will be enabled in production.
          </p>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Current subscription status ──────────────────────── */}
      {subLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-gray-500">Loading subscription…</p>
        </div>
      ) : subscription ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                Current Plan
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{subscription.plan_name}</h2>
                <Badge
                  label={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  variant={statusVariant(subscription.status)}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(subscription.start_date)} → {formatDate(subscription.end_date)}
              </p>
              {subscription.payment_reference && (
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Ref: {subscription.payment_reference}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(subscription.amount)}
              </p>
              {remaining !== null && subscription.status === 'active' && (
                <p className={`text-sm font-medium mt-1 ${remaining <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                  {remaining === 0
                    ? 'Expires today'
                    : `${remaining} day${remaining !== 1 ? 's' : ''} remaining`}
                </p>
              )}
            </div>
          </div>

          {/* Expiry warning */}
          {remaining !== null && remaining <= 7 && subscription.status === 'active' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Your subscription expires soon. Renew below to avoid interruption.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-yellow-800">
          <p className="font-semibold mb-1">No active subscription</p>
          <p>Choose a plan below to activate your school's account.</p>
        </div>
      )}

      {/* ── Plans ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {subscription?.status === 'active' ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        {subLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                current={subscription}
                onSelect={handleSelectPlan}
                loading={payLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Payment history ──────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Subscription History</h2>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
        ) : (history || []).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">No subscription history yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {['Plan', 'Amount', 'Status', 'Period', 'Reference'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(history || []).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.plan_name}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          variant={statusVariant(item.status)}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(item.start_date)} → {formatDate(item.end_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {item.payment_reference || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingPage
