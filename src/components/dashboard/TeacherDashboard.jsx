// src/components/dashboard/TeacherDashboard.jsx
import { useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #eee', borderRadius: 12,
      padding: '18px 20px', flex: 1, minWidth: 140,
    }}>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: color || '#1a1a1a', marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#bbb' }}>{sub}</p>}
    </div>
  )
}

// ─── Escalation card ─────────────────────────────────────────────────────────
function EscalationCard({ item, onResolve }) {
  const [expanded, setExpanded] = useState(false)
  const [teacherNote, setTeacherNote] = useState('')
  const [resolved, setResolved] = useState(false)

  function handleResolve() {
    setResolved(true)
    onResolve(item.id)
  }

  return (
    <div style={{
      border: '1px solid #AFA9EC', borderRadius: 12, padding: '16px 18px',
      background: resolved ? '#f9f9f9' : '#FAFBFF', opacity: resolved ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
            Assignment submission
          </p>
          <p style={{ fontSize: 12, color: '#aaa' }}>{item.timestamp} · Topic: {item.topic || 'Unknown'}</p>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 6,
          background: '#FAEEDA', color: '#633806', fontWeight: 600,
        }}>
          AI confidence: {item.aiFeedback?.confidence}%
        </span>
      </div>

      {/* Student submission preview */}
      <div style={{
        background: '#f5f5f5', borderRadius: 8, padding: '10px 12px',
        fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10,
        maxHeight: expanded ? 'none' : 80, overflow: 'hidden',
      }}>
        {item.studentSubmission}
      </div>

      {/* AI draft feedback */}
      <div style={{
        background: '#EEEDFE', borderRadius: 8, padding: '10px 12px',
        fontSize: 13, color: '#3C3489', lineHeight: 1.6, marginBottom: 10,
      }}>
        <span style={{ fontWeight: 700 }}>AI draft: </span>
        Score {item.aiFeedback?.score}% — {item.aiFeedback?.summary}
      </div>

      {/* Teacher note */}
      {!resolved && (
        <>
          <textarea
            value={teacherNote}
            onChange={e => setTeacherNote(e.target.value)}
            placeholder="Add your feedback note (optional)..."
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 13, marginBottom: 10,
              boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                border: '1px solid #ddd', background: '#fff',
                color: '#888', fontSize: 13, cursor: 'pointer',
              }}
            >
              {expanded ? 'Collapse' : 'Read full'}
            </button>
            <button
              onClick={handleResolve}
              style={{
                flex: 2, padding: '8px 0', borderRadius: 8, border: 'none',
                background: '#1D9E75', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✓ Mark reviewed & send
            </button>
          </div>
        </>
      )}

      {resolved && (
        <p style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, textAlign: 'center' }}>
          ✓ Reviewed and sent to student
        </p>
      )}
    </div>
  )
}

// ─── Main Teacher Dashboard ───────────────────────────────────────────────────
export default function TeacherDashboard() {
  const {
    scores, nodeStatus, completedNodes,
    escalationQueue, resolveEscalation,
    retryCount, weakTopics, activeTopic,
  } = useWorkflowStore()

  const [activeTab, setActiveTab] = useState('overview')

  // Build chart data from scores
  const nodeLabels = {
    '1': 'Start', '2': 'Resources', '3': 'Flashcards',
    '4': 'Quiz', '5': 'Condition', '6': 'End', '7': 'Weak Spot',
  }
  const chartData = Object.entries(scores).map(([nodeId, score]) => ({
    name: nodeLabels[nodeId] || `Node ${nodeId}`,
    score,
  }))

  const completedCount = completedNodes.length
  const pendingCount = Object.values(nodeStatus).filter(s => s === 'pending').length
  const failedCount = Object.values(nodeStatus).filter(s => s === 'failed').length
  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)
    : null

  const tabs = ['overview', 'scores', 'escalations', 'weak spots']

  return (
    <div style={{
      padding: '24px 28px', fontFamily: 'sans-serif',
      background: '#f9f9f9', minHeight: '100%', overflowY: 'auto',
    }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
          Teacher Dashboard
        </h2>
        <p style={{ fontSize: 14, color: '#888' }}>
          Current workflow topic: <strong style={{ color: '#7F77DD' }}>{activeTopic || 'Not set'}</strong>
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              border: activeTab === tab ? 'none' : '1px solid #eee',
              background: activeTab === tab ? '#7F77DD' : '#fff',
              color: activeTab === tab ? '#fff' : '#888',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
            }}
          >
            {tab}
            {tab === 'escalations' && escalationQueue.length > 0 && (
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

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <StatCard
              label="Nodes Completed"
              value={completedCount}
              sub="by student so far"
              color="#1D9E75"
            />
            <StatCard
              label="Average Score"
              value={avgScore !== null ? `${avgScore}%` : '—'}
              sub="across all scored nodes"
              color={avgScore >= 70 ? '#1D9E75' : avgScore !== null ? '#E24B4A' : '#aaa'}
            />
            <StatCard
              label="Retry Count"
              value={retryCount}
              sub="loop-backs triggered"
              color={retryCount > 2 ? '#E24B4A' : '#EF9F27'}
            />
            <StatCard
              label="Pending Review"
              value={escalationQueue.length}
              sub="submissions in queue"
              color={escalationQueue.length > 0 ? '#7F77DD' : '#1D9E75'}
            />
          </div>

          {/* Status breakdown */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #eee', marginBottom: 24,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>
              Node status breakdown
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(nodeStatus).map(([nodeId, status]) => (
                <div key={nodeId} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: status === 'done' ? '#E1F5EE'
                    : status === 'running' ? '#FAEEDA'
                    : status === 'failed' ? '#FAECE7'
                    : '#f5f5f5',
                  color: status === 'done' ? '#085041'
                    : status === 'running' ? '#633806'
                    : status === 'failed' ? '#712B13'
                    : '#888',
                  fontWeight: 500,
                }}>
                  {nodeLabels[nodeId] || `Node ${nodeId}`}: {status}
                </div>
              ))}
              {Object.keys(nodeStatus).length === 0 && (
                <p style={{ fontSize: 13, color: '#aaa' }}>No nodes run yet — student hasn't started.</p>
              )}
            </div>
          </div>

          {/* Retry alert */}
          {retryCount >= 3 && (
            <div style={{
              background: '#FAECE7', border: '1px solid #F0997B',
              borderRadius: 12, padding: '14px 18px',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#712B13', marginBottom: 4 }}>
                ⚠ Student struggling
              </p>
              <p style={{ fontSize: 13, color: '#993C1D', lineHeight: 1.6 }}>
                This student has looped back {retryCount} times. Consider reaching out directly.
                Current focus: <strong>{activeTopic}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SCORES TAB ── */}
      {activeTab === 'scores' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #eee' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
            Scores per node
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Score']}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.score >= 70 ? '#1D9E75' : entry.score >= 50 ? '#EF9F27' : '#E24B4A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: 14, color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
              No scored nodes yet — student hasn't taken a quiz.
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 14, fontSize: 13 }}>
            <span style={{ color: '#1D9E75' }}>■ ≥70% pass</span>
            <span style={{ color: '#EF9F27' }}>■ 50–69% borderline</span>
            <span style={{ color: '#E24B4A' }}>■ &lt;50% fail</span>
          </div>
        </div>
      )}

      {/* ── ESCALATIONS TAB ── */}
      {activeTab === 'escalations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {escalationQueue.length > 0 ? (
            escalationQueue.map(item => (
              <EscalationCard
                key={item.id}
                item={item}
                onResolve={resolveEscalation}
              />
            ))
          ) : (
            <div style={{
              background: '#fff', borderRadius: 12, padding: '40px',
              border: '1px solid #eee', textAlign: 'center',
            }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1D9E75', marginBottom: 4 }}>
                No pending escalations
              </p>
              <p style={{ fontSize: 13, color: '#aaa' }}>
                AI reviewed all submissions with high confidence.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── WEAK SPOTS TAB ── */}
      {activeTab === 'weak spots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {weakTopics.length > 0 ? (
            weakTopics.map((w, i) => (
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
                    {w.confidence}% gap confidence
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                  {w.recommendation}
                </p>
              </div>
            ))
          ) : (
            <div style={{
              background: '#fff', borderRadius: 12, padding: '40px',
              border: '1px solid #eee', textAlign: 'center',
            }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🧠</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                No weak spots detected yet
              </p>
              <p style={{ fontSize: 13, color: '#aaa' }}>
                Weak spots appear after a student fails a quiz and runs the Weak Spot Detector.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}