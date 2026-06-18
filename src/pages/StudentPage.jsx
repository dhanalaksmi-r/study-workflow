// src/pages/StudentPage.jsx
import { useState } from 'react'
import Navbar from '../components/Navbar'
import StudentDashboard from '../components/dashboard/StudentDashboard'
import StudentWorkflowRunner from '../components/student/StudentWorkflowRunner'

export default function StudentPage() {
  const [view, setView] = useState('dashboard')
  const [activeWorkflow, setActiveWorkflow] = useState(null)

  function handleRunWorkflow(workflow) {
    setActiveWorkflow(workflow)  // full workflow object, not just id
    setView('runner')
  }

  function handleBack() {
    setView('dashboard')
    setActiveWorkflow(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title={view === 'dashboard' ? 'My Learning' : activeWorkflow?.title || 'Workflow'} />

      {view === 'runner' && (
        <div style={{
          padding: '8px 20px', background: '#fff',
          borderBottom: '1px solid #eee', flexShrink: 0,
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#7F77DD', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to dashboard
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'dashboard' ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <StudentDashboard onRunWorkflow={handleRunWorkflow} />
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