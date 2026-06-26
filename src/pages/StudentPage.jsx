// src/pages/StudentPage.jsx
import { useState } from 'react'
import Navbar from '../components/Navbar'
import StudentDashboard from '../components/dashboard/StudentDashboard'
import StudentWorkflowRunner from '../components/student/StudentWorkflowRunner'
import { useAuth } from '../auth/useAuth'

export default function StudentPage() {
  const { logout } = useAuth()
  const [view, setView] = useState('dashboard')
  const [activeWorkflow, setActiveWorkflow] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function handleRunWorkflow(workflow) {
    setActiveWorkflow(workflow)
    setView('runner')
  }

  function handleBack() {
    setView('dashboard')
    setActiveWorkflow(null)
    // Trigger refetch in StudentDashboard
    setRefreshTrigger(prev => prev + 1)
  }

  async function handleLogout() {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title={view === 'dashboard' ? 'My Learning' : activeWorkflow?.title || 'Workflow'} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'dashboard' ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <StudentDashboard 
              onRunWorkflow={handleRunWorkflow}
              refreshTrigger={refreshTrigger}
            />
          </div>
        ) : (
          <StudentWorkflowRunner
            workflow={activeWorkflow}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}