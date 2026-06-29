// src/components/teacher/WorkflowBuilder.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/useAuth'
import WorkflowCanvas from '../canvas/WorkflowCanvas'

export default function WorkflowBuilder({ workflowId, onSaved }) {
  const { user } = useAuth()
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Load workflow if editing
  useState(() => {
    if (!workflowId) {
      setLoading(false)
      return
    }

    async function loadWorkflow() {
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .single()

        if (error) throw error

        setWorkflow(data)
        console.log('Loaded workflow:', data)
      } catch (err) {
        console.error('Error loading workflow:', err)
        setMessage(`❌ Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId])

  // Save node structure to DB
  async function handleSaveWorkflow(nodeStructure) {
    if (!workflow) return

    try {
      setMessage('Saving...')

      const { error } = await supabase
        .from('workflows')
        .update({
          node_structure: nodeStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id)

      if (error) throw error

      console.log('✅ Workflow saved to database')
      setMessage('✅ Workflow saved successfully!')

      setTimeout(() => {
        setMessage('')
        onSaved?.()
      }, 2000)
    } catch (err) {
      console.error('Error saving workflow:', err)
      setMessage(`❌ Error: ${err.message}`)
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading workflow...</div>
  }

  if (!workflow) {
    return (
      <div style={{ padding: 20, color: '#E24B4A' }}>
        No workflow found. Create one first.
      </div>
    )
  }

  const initialNodes = workflow.node_structure?.nodes || []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f9f9f9'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
            {workflow.title}
          </h3>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>
            Topic: {workflow.topic}
          </p>
        </div>

        {message && (
          <div style={{
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
            background: message.includes('✅') ? '#E1F5EE' : '#FAECE7',
            color: message.includes('✅') ? '#085041' : '#712B13'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WorkflowCanvas
          workflowId={workflow.id}
          initialNodes={initialNodes}
          onSave={handleSaveWorkflow}
        />
      </div>
    </div>
  )
}