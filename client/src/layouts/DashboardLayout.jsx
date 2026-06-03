import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar  from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ModuleProvider } from '../context/ModuleContext'

/**
 * DashboardLayout
 * ┌──────────────────────────────────────┐
 * │  Sidebar  │  Navbar                  │
 * │           ├──────────────────────────│
 * │           │  <Outlet /> (page)       │
 * └──────────────────────────────────────┘
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ModuleProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ModuleProvider>
  )
}

export default DashboardLayout
