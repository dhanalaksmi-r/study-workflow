// src/components/teacher/TeacherDashboard.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/useAuth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function TeacherDashboard({ onEditWorkflow }) {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [students, setStudents] = useState([])
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    async function fetchData() {
      try {
        // Fetch all workflows created by this teacher
        const { data: wfs, error: err1 } = await supabase
          .from('workflows')
          .select('id, title, topic, created_at')
          .eq('teacher_id', user.id)

        if (err1) throw err1
        setWorkflows(wfs || [])

        // Fetch all assigned workflows for this teacher's class
        const { data: assigned, error: err2 } = await supabase
          .from('assigned_workflows')
          .select('workflow_id')
          .eq('teacher_id', user.id)

        if (err2) throw err2

        const workflowIds = assigned?.map(a => a.workflow_id) || []

        // Fetch all workflow runs for these workflows
        const { data: allRuns, error: err3 } = await supabase
          .from('workflow_runs')
          .select('id, workflow_id, student_id, status, last_score')
          .in('workflow_id', workflowIds.length > 0 ? workflowIds : ['00000000-0000-0000-0000-000000000000'])

        if (err3) throw err3
        setRuns(allRuns || [])

        // Fetch student details
        if (workflowIds.length > 0) {
          const studentIds = [...new Set(allRuns?.map(r => r.student_id) || [])]
          
          if (studentIds.length > 0) {
            const { data: studentList, error: err4 } = await supabase
              .from('users')
              .select('id, email, name')
              .in('id', studentIds)

            if (err4) throw err4
            setStudents(studentList || [])
          }
        }

        console.log('Dashboard data:', { workflows: wfs, runs: allRuns, students })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Delete workflow
  async function handleDeleteWorkflow(workflowId) {
    if (!confirm('Delete this workflow? This cannot be undone.')) return

    setDeleting(workflowId)
    try {
      // Delete from assigned_workflows
      await supabase
        .from('assigned_workflows')
        .delete()
        .eq('workflow_id', workflowId)

      // Delete from workflows
      await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)

      // Remove from local state
      setWorkflows(wfs => wfs.filter(w => w.id !== workflowId))
      setRuns(rs => rs.filter(r => r.workflow_id !== workflowId))

      console.log('✅ Workflow deleted')
    } catch (err) {
      console.error('Error deleting workflow:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>
  if (error) return <div style={{ padding: 20, color: '#E24B4A' }}>Error: {error}</div>

  // Calculate stats
  const totalStudents = students.length
  const completedRuns = runs.filter(r => r.status === 'complete').length
  const completionRate = totalStudents > 0 ? Math.round((completedRuns / (totalStudents * workflows.length)) * 100) : 0
  const avgScore = runs.length > 0
    ? Math.round(runs.reduce((sum, r) => sum + (r.last_score || 0), 0) / runs.length)
    : 0

  // Student progress table
  const studentProgress = students.map(student => {
    const studentRuns = runs.filter(r => r.student_id === student.id)
    const completed = studentRuns.filter(r => r.status === 'complete').length
    const avgStudentScore = studentRuns.length > 0
      ? Math.round(studentRuns.reduce((sum, r) => sum + (r.last_score || 0), 0) / studentRuns.length)
      : 0

    return {
      ...student,
      completedWorkflows: completed,
      avgScore: avgStudentScore,
      totalAssigned: workflows.length
    }
  }).sort((a, b) => b.completedWorkflows - a.completedWorkflows)

  // Chart data
  const scoreDistribution = [
    { range: '0-20%', count: runs.filter(r => (r.last_score || 0) < 20).length },
    { range: '20-40%', count: runs.filter(r => (r.last_score || 0) >= 20 && (r.last_score || 0) < 40).length },
    { range: '40-60%', count: runs.filter(r => (r.last_score || 0) >= 40 && (r.last_score || 0) < 60).length },
    { range: '60-80%', count: runs.filter(r => (r.last_score || 0) >= 60 && (r.last_score || 0) < 80).length },
    { range: '80-100%', count: runs.filter(r => (r.last_score || 0) >= 80).length }
  ]

  return (
    <div style={{
      padding: '24px 28px',
      fontFamily: 'sans-serif',
      background: '#f9f9f9',
      minHeight: '100%'
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
        📊 Class Dashboard
      </h2>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} • {totalStudents} student{totalStudents !== 1 ? 's' : ''}
      </p>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '18px 20px',
          flex: 1,
          minWidth: 130,
          border: '1px solid #eee'
        }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>Completion Rate</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1e40af', marginBottom: 2 }}>{completionRate}%</p>
          <p style={{ fontSize: 11, color: '#bbb' }}>{completedRuns} of {totalStudents * workflows.length}</p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '18px 20px',
          flex: 1,
          minWidth: 130,
          border: '1px solid #eee'
        }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>Average Score</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1D9E75', marginBottom: 2 }}>{avgScore}%</p>
          <p style={{ fontSize: 11, color: '#bbb' }}>Across all attempts</p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '18px 20px',
          flex: 1,
          minWidth: 130,
          border: '1px solid #eee'
        }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>Active Students</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#EF9F27', marginBottom: 2 }}>{totalStudents}</p>
          <p style={{ fontSize: 11, color: '#bbb' }}>Assigned workflows</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['overview', 'students', 'scores'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              border: activeTab === tab ? 'none' : '1px solid #eee',
              background: activeTab === tab ? '#1e40af' : '#fff',
              color: activeTab === tab ? '#fff' : '#888',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          >
            {tab === 'overview' && '📈 Overview'}
            {tab === 'students' && '👥 Students'}
            {tab === 'scores' && '📊 Score Distribution'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '1px solid #eee'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            📈 Workflows
          </p>
          
          {workflows.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No workflows created yet
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {workflows.map(wf => {
                const wfRuns = runs.filter(r => r.workflow_id === wf.id)
                const wfCompleted = wfRuns.filter(r => r.status === 'complete').length
                const wfAvg = wfRuns.length > 0
                  ? Math.round(wfRuns.reduce((sum, r) => sum + (r.last_score || 0), 0) / wfRuns.length)
                  : 0

                return (
                  <div key={wf.id} style={{
                    background: '#f9f9f9',
                    borderRadius: 10,
                    padding: 12,
                    border: '1px solid #eee',
                    position: 'relative'
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
                      {wf.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                      Topic: {wf.topic}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: '#7F77DD', fontWeight: 600 }}>
                        {wfCompleted}/{totalStudents} done
                      </span>
                      <span style={{ color: '#1D9E75', fontWeight: 600 }}>
                        Avg: {wfAvg}%
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      disabled={deleting === wf.id}
                      style={{
                        width: '100%',
                        padding: '6px 0',
                        background: '#E24B4A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: deleting === wf.id ? 'not-allowed' : 'pointer',
                        opacity: deleting === wf.id ? 0.6 : 1
                      }}
                    >
                      {deleting === wf.id ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '1px solid #eee',
          overflowX: 'auto'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            👥 Student Progress
          </p>

          {studentProgress.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
              No student data yet
            </p>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 700, color: '#1a1a1a' }}>
                    Student
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 0', fontWeight: 700, color: '#1a1a1a' }}>
                    Email
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 0', fontWeight: 700, color: '#1a1a1a' }}>
                    Completed
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 0', fontWeight: 700, color: '#1a1a1a' }}>
                    Avg Score
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 0', fontWeight: 700, color: '#1a1a1a' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentProgress.map((student, i) => (
                  <tr key={student.id} style={{
                    borderBottom: i < studentProgress.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <td style={{ padding: '12px 0', color: '#1a1a1a', fontWeight: 600 }}>
                      {student.name}
                    </td>
                    <td style={{ padding: '12px 0', color: '#888', textAlign: 'center' }}>
                      {student.email}
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#7F77DD' }}>
                      {student.completedWorkflows}/{student.totalAssigned}
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#1D9E75' }}>
                      {student.avgScore}%
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 6,
                        background: student.completedWorkflows === student.totalAssigned ? '#E1F5EE' : '#EEEDFE',
                        color: student.completedWorkflows === student.totalAssigned ? '#085041' : '#534AB7',
                        fontWeight: 600
                      }}>
                        {student.completedWorkflows === student.totalAssigned ? '✓ Complete' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SCORES TAB */}
      {activeTab === 'scores' && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '20px',
          border: '1px solid #eee'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            📊 Score Distribution
          </p>

          {runs.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => [v, 'Count']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((entry, i) => (
                    <Cell key={i} fill="#1e40af" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              No score data yet
            </p>
          )}
        </div>
      )}
    </div>
  )
}