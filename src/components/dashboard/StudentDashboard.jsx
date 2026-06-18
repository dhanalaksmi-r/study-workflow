// src/components/dashboard/StudentDashboard.jsx
import { useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #eee',
      borderRadius: 12, padding: '18px 20px', flex: 1, minWidth: 130,
    }}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: color || '#1a1a1a', marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#bbb' }}>{sub}</p>}
    </div>
  )
}

function WorkflowCard({ workflow, onRun, progress, status }) {
  const statusMap = {
    'not-started': { label: 'Not started', bg: '#f5f5f5', color: '#888' },
    'in-progress': { label: 'In progress', bg: '#FAEEDA', color: '#633806' },
    'complete':    { label: 'Complete ✓',  bg: '#E1F5EE', color: '#085041' },
  }
  const s = statusMap[status || 'not-started']

  return (
    <div style={{
      background: '#fff', border: '2px solid #eee',
      borderRadius: 12, padding: '18px 20px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
            {workflow.title}
          </p>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 6,
            background: s.bg, color: s.color, fontWeight: 600,
          }}>
            {s.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
          {workflow.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, height: 6, background: '#f0f0f0',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${progress || 0}%`,
              background: progress === 100 ? '#1D9E75' : '#7F77DD',
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>
            {progress || 0}%
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
          Assigned {workflow.assignedAt}
        </p>
      </div>
      <button
        onClick={() => onRun(workflow)}
        style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          cursor: 'pointer', fontWeight: 600, fontSize: 13, flexShrink: 0,
          background: status === 'complete' ? '#E1F5EE'
            : status === 'in-progress' ? '#7F77DD' : '#7F77DD',
          color: status === 'complete' ? '#085041' : '#fff',
        }}
      >
        {status === 'complete' ? 'Review' : status === 'in-progress' ? 'Continue →' : 'Start →'}
      </button>
    </div>
  )
}

export default function StudentDashboard({ onRunWorkflow }) {
  const {
    scores, nodeStatus, weakTopics,
    assignedWorkflows, workflowProgress,
    resetStudentProgress,
  } = useWorkflowStore()

  const [activeTab, setActiveTab] = useState('workflows')

  // Chart data
  const nodeLabels = {
    '2': 'Resources', '3': 'Flashcards',
    '4': 'Quiz', '5': 'Condition',
    '6': 'End', '7': 'Weak Spot',
  }
  const chartData = Object.entries(scores).map(([id, score]) => ({
    name: nodeLabels[id] || `Node ${id}`,
    score,
  }))

  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length)
    : null

  const nodesCompleted = Object.values(nodeStatus).filter(s => s === 'done').length

  function handleRun(workflow) {
    // Reset student progress before starting a new workflow
    resetStudentProgress()
    if (onRunWorkflow) onRunWorkflow(workflow)
  }

  const tabs = ['workflows', 'scores', 'weak areas']

  return (
    <div style={{
      padding: '24px 28px', fontFamily: 'sans-serif',
      background: '#f9f9f9', minHeight: '100%',
    }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
          My Learning Dashboard
        </h2>
        <p style={{ fontSize: 14, color: '#888' }}>
          {assignedWorkflows.length === 0
            ? 'No workflows assigned yet — your teacher will assign one soon.'
            : `${assignedWorkflows.length} workflow${assignedWorkflows.length > 1 ? 's' : ''} assigned to you`
          }
        </p>
      </div>

      {/* Stat cards — only meaningful after running a workflow */}
      {nodesCompleted > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard
            label="Nodes completed"
            value={nodesCompleted}
            sub="in current run"
            color="#7F77DD"
          />
          <StatCard
            label="Average score"
            value={avgScore !== null ? `${avgScore}%` : '—'}
            color={avgScore >= 70 ? '#1D9E75' : avgScore !== null ? '#E24B4A' : '#aaa'}
          />
          <StatCard
            label="Weak areas"
            value={weakTopics.length}
            color={weakTopics.length > 0 ? '#EF9F27' : '#1D9E75'}
          />
          <StatCard
            label="Workflows done"
            value={Object.values(workflowProgress).filter(s => s === 'complete').length}
            sub={`of ${assignedWorkflows.length} assigned`}
            color="#1D9E75"
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              border: activeTab === tab ? 'none' : '1px solid #eee',
              background: activeTab === tab ? '#1D9E75' : '#fff',
              color: activeTab === tab ? '#fff' : '#888',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── WORKFLOWS TAB ── */}
      {activeTab === 'workflows' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignedWorkflows.length === 0 ? (
            // Empty state — no workflows assigned yet
            <div style={{
              background: '#fff', borderRadius: 16,
              padding: '60px 40px', border: '2px dashed #eee',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
                No workflows yet
              </p>
              <p style={{ fontSize: 14, color: '#888', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
                Your teacher hasn't assigned any workflows yet.
                Once they publish one, it will appear here and you can start learning.
              </p>
            </div>
          ) : (
            assignedWorkflows.map(wf => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onRun={handleRun}
                progress={workflowProgress[wf.id] === 'complete' ? 100
                  : workflowProgress[wf.id] === 'in-progress'
                    ? Math.min(Math.round((nodesCompleted / 5) * 100), 99)
                    : 0}
                status={workflowProgress[wf.id] || 'not-started'}
              />
            ))
          )}
        </div>
      )}

      {/* ── SCORES TAB ── */}
      {activeTab === 'scores' && (
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: '20px', border: '1px solid #eee',
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            My scores
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.score >= 70 ? '#1D9E75' : entry.score >= 50 ? '#EF9F27' : '#E24B4A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: 14, color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              Complete a quiz to see your scores here.
            </p>
          )}
        </div>
      )}

      {/* ── WEAK AREAS TAB ── */}
      {activeTab === 'weak areas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {weakTopics.length > 0 ? weakTopics.map((w, i) => (
            <div key={i} style={{
              background: '#fff', border: '1px solid #F5C99B',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#712B13' }}>{w.subtopic}</p>
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 6,
                  background: '#FAEEDA', color: '#633806', fontWeight: 600,
                }}>
                  {w.confidence}% gap
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{w.recommendation}</p>
            </div>
          )) : (
            <div style={{
              background: '#E1F5EE', borderRadius: 12, padding: '40px',
              border: '1px solid #5DCAA5', textAlign: 'center',
            }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🎉</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#085041', marginBottom: 4 }}>
                No weak areas detected
              </p>
              <p style={{ fontSize: 13, color: '#0F6E56' }}>
                Complete a quiz and run the Weak Spot Detector to see personalised gaps.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}