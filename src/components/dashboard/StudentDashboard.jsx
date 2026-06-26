// src/components/dashboard/StudentDashboard.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/useAuth'

export default function StudentDashboard({ onRunWorkflow, refreshTrigger = 0 }) {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [workflowRuns, setWorkflowRuns] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    async function fetchData() {
      try {
        // Fetch assigned workflows
        const { data: assigned, error: err1 } = await supabase
          .from('assigned_workflows')
          .select(`
            id, 
            workflow_id, 
            assigned_at,
            workflows (
              id, 
              title, 
              topic, 
              description,
              teacher_id
            )
          `)

        if (err1) throw err1

        const validWorkflows = (assigned || []).filter(w => w.workflows)
        setWorkflows(validWorkflows)

        // Fetch workflow runs for this student
        const { data: runs, error: err2 } = await supabase
          .from('workflow_runs')
          .select('workflow_id, status, last_score, completed_at')
          .eq('student_id', user.id)

        console.log('Fetched workflow runs:', { runs, error: err2 })

        if (err2) throw err2

        // Map runs by workflow_id
        const runsMap = {}
        runs?.forEach(run => {
          runsMap[run.workflow_id] = run
        })
        setWorkflowRuns(runsMap)

        console.log('Workflows:', validWorkflows)
        console.log('Runs Map:', runsMap)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, refreshTrigger])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading workflows...</div>
  }

  if (error) {
    return <div style={{ padding: 20, color: '#E24B4A' }}>Error: {error}</div>
  }

  return (
    <div style={{
      padding: '24px 28px',
      fontFamily: 'sans-serif',
      background: '#f9f9f9',
      minHeight: '100%'
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
        My Learning Dashboard
      </h2>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        {workflows.length === 0
          ? 'No workflows assigned yet — your teacher will assign one soon.'
          : `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} assigned to you`}
      </p>

      {workflows.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '60px 40px',
          border: '2px dashed #eee',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            No workflows yet
          </p>
          <p style={{ fontSize: 14, color: '#888', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            Your teacher hasn't assigned any workflows yet.
            Once they publish one, it will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workflows.map(item => {
            const wf = item.workflows
            const run = workflowRuns[wf.id]
            const isComplete = run?.status === 'complete'
            const score = run?.last_score || 0

            return (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  border: isComplete ? '2px solid #1D9E75' : '2px solid #7F77DD',
                  borderRadius: 12,
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                      {wf?.title || 'Untitled Workflow'}
                    </p>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: isComplete ? '#E1F5EE' : '#EEEDFE',
                      color: isComplete ? '#085041' : '#534AB7',
                      fontWeight: 600
                    }}>
                      {isComplete ? '✓ Complete' : 'Not started'}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                    Topic: <strong>{wf?.topic || 'N/A'}</strong>
                  </p>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      flex: 1,
                      height: 6,
                      background: '#f0f0f0',
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 3,
                        width: isComplete ? '100%' : '0%',
                        background: isComplete ? '#1D9E75' : '#7F77DD',
                        transition: 'width 0.4s'
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>
                      {isComplete ? '100%' : '0%'}
                    </span>
                  </div>

                  {isComplete && (
                    <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 8, fontWeight: 600 }}>
                      Final Score: {score}% ✓
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRunWorkflow?.(wf)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: isComplete ? '#E1F5EE' : '#7F77DD',
                    color: isComplete ? '#085041' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13,
                    flexShrink: 0
                  }}
                >
                  {isComplete ? 'Review' : 'Start →'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}