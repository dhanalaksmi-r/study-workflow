// src/pages/TeacherPage.jsx
import { useState } from 'react'
import Navbar from '../components/Navbar'
import WorkflowCanvas from '../components/canvas/WorkflowCanvas'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import { useWorkflowStore } from '../store/workflowStore'

export default function TeacherPage() {
  const [view, setView] = useState('canvas') // 'canvas' | 'dashboard'
  const { escalationQueue } = useWorkflowStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title={view === 'canvas' ? 'Workflow Builder' : 'Dashboard'} />

      {/* View switcher */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid #eee', background: '#fff',
        padding: '0 20px', flexShrink: 0,
      }}>
        {[
          { key: 'canvas', label: '🗂 Canvas Builder' },
          { key: 'dashboard', label: '📊 Class Dashboard' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: 'none', fontSize: 14, fontWeight: 600,
              color: view === key ? '#7F77DD' : '#aaa',
              borderBottom: view === key ? '2px solid #7F77DD' : '2px solid transparent',
              marginBottom: -1,
              position: 'relative',
            }}
          >
            {label}
            {key === 'dashboard' && escalationQueue.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#E24B4A', color: '#fff',
                borderRadius: 10, padding: '1px 7px', fontSize: 11,
              }}>
                {escalationQueue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'canvas'
          ? <WorkflowCanvas />
          : <div style={{ height: '100%', overflowY: 'auto' }}><TeacherDashboard /></div>
        }
      </div>
    </div>
  )
}