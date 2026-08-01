// src/pages/TeacherPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'
import Navbar from '../components/Navbar'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import WorkflowBuilder from '../components/teacher/WorkflowBuilder'

export default function TeacherPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [view, setView] = useState('dashboard')
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)

  async function handleCreateWorkflow(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert([{
          teacher_id: user.id,
          title: title || `Learn: ${topic}`,
          topic,
          description: description || `Master ${topic} through guided learning.`,
          node_structure: { nodes: [], edges: [] }
        }])
        .select()

      if (error) throw error

      setMessage(`✓ Workflow "${topic}" created!`)
      setTopic('')
      setTitle('')
      setDescription('')

      if (data?.[0]) {
        await supabase
          .from('assigned_workflows')
          .insert([{
            workflow_id: data[0].id,
            teacher_id: user.id,
            class_name: 'Class 1'
          }])

        setMessage(`✓ Workflow created and assigned to students!`)
        
        // Auto-open canvas for editing
        setTimeout(() => {
          setSelectedWorkflowId(data[0].id)
          setView('canvas')
        }, 1500)
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title="Teacher Dashboard" />

      {/* View tabs */}
      <div style={{
        padding: '0 28px',
        borderBottom: '1px solid #eee',
        background: '#fff',
        display: 'flex',
        gap: 24,
        height: 50,
        alignItems: 'center'
      }}>
        <button
          onClick={() => setView('dashboard')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            color: view === 'dashboard' ? '#1e40af' : '#888',
            cursor: 'pointer',
            borderBottom: view === 'dashboard' ? '3px solid  #1e40af' : 'none',
            paddingBottom: 16,
            marginBottom: -1
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setView('create')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            color: view === 'create' ? '#1e40af' : '#888',
            cursor: 'pointer',
            borderBottom: view === 'create' ? '3px solid #1e40af' : 'none',
            paddingBottom: 16,
            marginBottom: -1
          }}
        >
          ➕ Create Workflow
        </button>
        
        {selectedWorkflowId && (
          <button
            onClick={() => setView('canvas')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: view === 'canvas' ? '#1e40af' : '#888',
              cursor: 'pointer',
              borderBottom: view === 'canvas' ? '3px solid #1e40af' : 'none',
              paddingBottom: 16,
              marginBottom: -1
            }}
          >
            🎨 Edit Canvas
          </button>
        )}

        <div style={{ flex: 1 }} />

        
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'dashboard' ? (
          <TeacherDashboard />
        ) : view === 'canvas' ? (
          <WorkflowBuilder
            workflowId={selectedWorkflowId}
            onSaved={() => {
              setSelectedWorkflowId(null)
              setView('dashboard')
            }}
          />
        ) : (
          <div style={{ padding: '24px 28px', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
              Create a Workflow
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Create a new workflow, then customize it with the canvas editor.
            </p>

            {message && (
              <div style={{
                background: message.includes('✓') ? '#E1F5EE' : '#FAECE7',
                border: message.includes('✓') ? '1px solid #5DCAA5' : '1px solid #F0997B',
                color: message.includes('✓') ? '#085041' : '#712B13',
                padding: 12,
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleCreateWorkflow} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #eee'
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#888' }}>
                  Topic (required)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., React Hooks, Python Basics, etc."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#888' }}>
                  Workflow Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#888' }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of what students will learn"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #ddd',
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    minHeight: 80,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!topic || loading}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: 'none',
                  background: !topic ? '#ccc' : '#667eea',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: !topic || loading ? 'not-allowed' : 'pointer',
                  opacity: !topic ? 0.6 : 1,
                  marginBottom: 12
                }}
              >
                {loading ? 'Creating...' : '📤 Create Workflow'}
              </button>

              <p style={{ fontSize: 12, color: '#888' }}>
                You'll be able to customize the learning path in the canvas editor after creation.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}