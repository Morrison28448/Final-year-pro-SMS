import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar  from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ModuleProvider } from '../context/ModuleContext'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ModuleProvider>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="app-main">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="page-content">
            <div className="page-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ModuleProvider>
  )
}

export default DashboardLayout
