// src/components/nodes/AssignmentReviewerNode.jsx
import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON } from '../../api/geminiApi'
import NodeHeader from './shared/NodeHeader'
import ScrollArea from './shared/ScrollArea'

const SYSTEM_PROMPT = `You are an assignment reviewer for a teacher.
You will receive a student's submission and a rubric.
Return a JSON object with:
- score: number 0-100
- confidence: number 0-100 (how confident you are in your assessment)
- strengths: array of exactly 2 specific strengths (not generic)
- weaknesses: array of exactly 2 specific weaknesses (not generic)
- suggestions: array of exactly 2 specific, actionable improvement suggestions
- summary: one sentence overall assessment

Rules:
- Be specific. Never say "good job" or "needs improvement" without context
- Base everything strictly on the rubric provided
- If the submission is off-topic or very short, give a low score and low confidence
- Return ONLY valid JSON object, no extra text, no markdown fences`

export default function AssignmentReviewerNode({ id, data }) {
  const {
    nodeOutputs, setOutput, setStatus, nodeStatus,
    addEscalation, activeTopic,
  } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]

  // Teacher-configurable rubric (editable from the node)
  const [rubric, setRubric] = useState(
    existingOutput?.rubric ||
    data?.rubric ||
    'Check for: clear explanation, correct examples, proper structure'
  )
  const [editingRubric, setEditingRubric] = useState(false)

  const [feedback, setFeedback] = useState(existingOutput?.feedback || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [escalated, setEscalated] = useState(existingOutput?.escalated || false)
  const [collapsed, setCollapsed] = useState(false)

  const status = nodeStatus[id] || 'pending'

  // Find the TextInputNode's submitted text
  const textEntry = Object.entries(nodeOutputs).find(
    ([, out]) => out?.text && out?.submitted
  )
  const submission = textEntry?.[1]?.text

  const statusColors = {
    pending:   { bg: '#f5f5f5', color: '#888' },
    running:   { bg: '#FAEEDA', color: '#633806' },
    done:      { bg: '#E1F5EE', color: '#085041' },
    escalated: { bg: '#EEEDFE', color: '#3C3489' },
    failed:    { bg: '#FAECE7', color: '#712B13' },
  }

  async function review() {
    if (!submission) return
    setLoading(true)
    setError('')
    setStatus(id, 'running')

    try {
      const userMessage = `
Rubric: ${rubric}
Topic: ${activeTopic || 'General'}
Student submission: ${submission}
      `.trim()

      const result = await callGeminiJSON(SYSTEM_PROMPT, userMessage)
      setFeedback(result)

      // If AI confidence is LOW (45–55 range = uncertain) → escalate to teacher
      if (result.confidence < 55) {
        setEscalated(true)
        setStatus(id, 'escalated')
        addEscalation({
          studentSubmission: submission,
          aiFeedback: result,
          rubric,
          topic: activeTopic,
          nodeId: id,
          timestamp: new Date().toLocaleString(),
        })
        setOutput(id, { rubric, feedback: result, escalated: true })
      } else {
        setStatus(id, 'done')
        setOutput(id, { rubric, feedback: result, escalated: false })
      }
    } catch (e) {
      console.error(e)
      setError(e.message || 'Review failed. Check console.')
      setStatus(id, 'failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = feedback?.score >= 70 ? '#1D9E75'
    : feedback?.score >= 50 ? '#EF9F27' : '#E24B4A'

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${
        status === 'done' ? '#5DCAA5'
        : status === 'escalated' ? '#AFA9EC'
        : '#F5C99B'
      }`,
      borderRadius: 14, padding: 18, width: 400,
      fontFamily: 'sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
    }}>
      <Handle type="target" position={Position.Top} />

      <NodeHeader
        badge="AI NODE"
        badgeColor={{ bg: '#FAEEDA', color: '#633806' }}
        title="Assignment Reviewer"
        status={status}
        statusColors={statusColors[status]}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {!collapsed && (
        <>
          {/* Rubric config */}
          <div style={{
            background: '#FAFAFA', borderRadius: 10, padding: '12px 14px', marginBottom: 14,
            border: '1px solid #eee',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rubric (teacher sets this)
              </span>
              <button
                onClick={() => setEditingRubric(r => !r)}
                style={{ fontSize: 12, color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {editingRubric ? 'Save' : 'Edit'}
              </button>
            </div>
            {editingRubric ? (
              <textarea
                value={rubric}
                onChange={e => setRubric(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #ddd', fontSize: 13, resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.5,
                }}
              />
            ) : (
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{rubric}</p>
            )}
          </div>

          {/* Submission preview */}
          {submission ? (
            <div style={{
              background: '#f5f5f5', borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              fontSize: 13, color: '#555', lineHeight: 1.6,
              maxHeight: 100, overflowY: 'auto',
            }}>
              <span style={{ fontWeight: 600, color: '#888', fontSize: 12 }}>Student submission: </span>
              {submission}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 14, lineHeight: 1.6 }}>
              Waiting for TextInputNode submission...
            </p>
          )}

          {/* Review button */}
          {!feedback && (
            <button
              onClick={review}
              disabled={loading || !submission}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                cursor: !submission || loading ? 'not-allowed' : 'pointer',
                background: !submission || loading ? '#ccc' : '#EF9F27',
                color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 14,
              }}
            >
              {loading ? 'Reviewing submission...' : 'Review with AI'}
            </button>
          )}

          {error && (
            <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>⚠ {error}</p>
          )}

          {/* Escalation notice */}
          {escalated && (
            <div style={{
              background: '#EEEDFE', border: '1px solid #AFA9EC',
              borderRadius: 10, padding: '12px 14px', marginBottom: 14,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3C3489', marginBottom: 4 }}>
                ↗ Sent to teacher queue
              </p>
              <p style={{ fontSize: 13, color: '#534AB7', lineHeight: 1.6 }}>
                AI confidence was low ({feedback?.confidence}%) — a teacher will review
                this submission and send feedback manually.
              </p>
            </div>
          )}

          {/* Feedback */}
          {feedback && !escalated && (
            <ScrollArea maxHeight={380}>
              {/* Score */}
              <div style={{
                background: feedback.score >= 70 ? '#E1F5EE' : feedback.score >= 50 ? '#FAEEDA' : '#FAECE7',
                borderRadius: 10, padding: '14px 16px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: scoreColor, marginBottom: 2 }}>
                  {feedback.score}%
                </p>
                <p style={{ fontSize: 13, color: '#888' }}>
                  {feedback.summary}
                </p>
              </div>

              {/* Strengths */}
              <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#085041', marginBottom: 8 }}>
                  ✓ Strengths
                </p>
                {feedback.strengths?.map((s, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#0F6E56', marginBottom: 4, lineHeight: 1.6 }}>
                    • {s}
                  </p>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ background: '#FAECE7', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#712B13', marginBottom: 8 }}>
                  ✗ Needs improvement
                </p>
                {feedback.weaknesses?.map((w, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#993C1D', marginBottom: 4, lineHeight: 1.6 }}>
                    • {w}
                  </p>
                ))}
              </div>

              {/* Suggestions */}
              <div style={{ background: '#EEEDFE', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#3C3489', marginBottom: 8 }}>
                  💡 How to improve
                </p>
                {feedback.suggestions?.map((s, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#534AB7', marginBottom: 4, lineHeight: 1.6 }}>
                    {i + 1}. {s}
                  </p>
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}