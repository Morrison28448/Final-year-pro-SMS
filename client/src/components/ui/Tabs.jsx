/**
 * Tabs — pill-style tab bar used across list pages
 */
const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="tabs-pill">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`tab-pill ${activeTab === tab.id ? 'tab-pill-active' : ''}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)

export default Tabs
