// src/pages/TeacherPage.jsx
import { useAuth } from '../auth/useAuth'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

export default function TeacherPage() {
  const { user, logout } = useAuth()
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
          node_structure: { nodes: [], edges: [] }, // Empty for now
        }])
        .select()

      if (error) throw error

      setMessage(`✓ Workflow "${topic}" created!`)
      setTopic('')
      setTitle('')
      setDescription('')

      // Now assign it
      if (data?.[0]) {
        await supabase
          .from('assigned_workflows')
          .insert([{
            workflow_id: data[0].id,
            teacher_id: user.id,
            class_name: 'Class 1',
          }])

        setMessage(`✓ Workflow assigned to students!`)
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <Navbar title="Teacher Dashboard" />

      <div style={{ padding: '24px 28px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
            Create a Workflow
          </h2>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>

        {message && (
          <div style={{
            background: message.includes('✓') ? '#E1F5EE' : '#FAECE7',
            border: message.includes('✓') ? '1px solid #5DCAA5' : '1px solid #F0997B',
            color: message.includes('✓') ? '#085041' : '#712B13',
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleCreateWorkflow} style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #eee',
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
                boxSizing: 'border-box',
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
                boxSizing: 'border-box',
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
                fontFamily: 'inherit',
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
            }}
          >
            {loading ? 'Creating...' : '📤 Create & Assign to Students'}
          </button>
        </form>

        <p style={{ fontSize: 13, color: '#888', marginTop: 20 }}>
          Created workflows will be immediately assigned to students. They'll see them in their dashboard.
        </p>
      </div>
    </div>
  )
}