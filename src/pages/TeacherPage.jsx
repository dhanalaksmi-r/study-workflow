// src/pages/TeacherPage.jsx
import { useState } from 'react'
import Navbar from '../components/Navbar'
import WorkflowCanvas from '../components/canvas/WorkflowCanvas'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import { useWorkflowStore } from '../store/workflowStore'

export default function TeacherPage() {
  const [view, setView] = useState('canvas')
  const { escalationQueue, activeTopic, assignWorkflow, assignedWorkflows } = useWorkflowStore()
  const [published, setPublished] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  function publishWorkflow() {
    if (!activeTopic) {
      alert('Please set a topic in the Start Node first.')
      return
    }
    assignWorkflow({
      id: `wf-${Date.now()}`,
      title: `Learn: ${activeTopic}`,
      description: `Master "${activeTopic}" through curated resources, flashcards, and adaptive quizzes.`,
      topic: activeTopic,
    })
    setPublished(true)
    setShowPublishModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title={view === 'canvas' ? 'Workflow Builder' : 'Dashboard'} />

      {/* View switcher + Publish button */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee', background: '#fff',
        padding: '0 20px', flexShrink: 0,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'canvas',    label: '🗂 Canvas Builder' },
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
                marginBottom: -1, position: 'relative',
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

        {/* Publish button */}
        {view === 'canvas' && (
          <button
            onClick={() => setShowPublishModal(true)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#1D9E75', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            📤 Assign to Students
          </button>
        )}
      </div>

      {/* Publish confirmation modal */}
      {showPublishModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32,
            width: 400, fontFamily: 'sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Assign workflow to students
            </h3>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              This will publish the current workflow to your students.
              They will see it in their dashboard and can start it immediately.
            </p>
            <div style={{
              background: '#f5f5f5', borderRadius: 8, padding: '12px 14px',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, color: '#555' }}>
                <strong>Topic:</strong> {activeTopic || 'Not set'}
              </p>
            </div>
            {!activeTopic && (
              <p style={{
                fontSize: 13, color: '#E24B4A', marginBottom: 16,
              }}>
                ⚠ No topic set. Go to the Start Node and set a topic first.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: '1px solid #eee', background: '#fff',
                  color: '#888', fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={publishWorkflow}
                disabled={!activeTopic}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: activeTopic ? '#1D9E75' : '#ccc',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: activeTopic ? 'pointer' : 'not-allowed',
                }}
              >
                Publish & assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published banner */}
      {published && (
        <div style={{
          background: '#E1F5EE', borderBottom: '1px solid #5DCAA5',
          padding: '10px 20px', fontSize: 13, color: '#085041',
          fontWeight: 500, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span>
            ✓ Workflow "{activeTopic}" assigned to students —
            they can now see and start it from their dashboard.
            ({assignedWorkflows.length} workflow{assignedWorkflows.length !== 1 ? 's' : ''} assigned total)
          </span>
          <button
            onClick={() => setPublished(false)}
            style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: '#085041', fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'canvas'
          ? <WorkflowCanvas />
          : <div style={{ height: '100%', overflowY: 'auto' }}>
              <TeacherDashboard />
            </div>
        }
      </div>
    </div>
  )
}