// src/components/nodes/TextInputNode.jsx
// Student types their assignment answer here — passes text to AssignmentReviewerNode
import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import NodeHeader from './shared/NodeHeader'

export default function TextInputNode({ id, data, standalone}) {
  const { nodeOutputs, setOutput, setStatus, nodeStatus } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [text, setText] = useState(existingOutput?.text || '')
  const [submitted, setSubmitted] = useState(existingOutput?.submitted || false)
  const [collapsed, setCollapsed] = useState(false)

  const status = nodeStatus[id] || 'pending'

  const statusColors = {
    pending: { bg: '#f5f5f5', color: '#888' },
    done:    { bg: '#E1F5EE', color: '#085041' },
  }

  function submit() {
    if (!text.trim()) return
    setSubmitted(true)
    setStatus(id, 'done')
    setOutput(id, { text, submitted: true })
  }

  function edit() {
    setSubmitted(false)
    setStatus(id, 'pending')
  }

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${status === 'done' ? '#5DCAA5' : '#ddd'}`,
      borderRadius: 14, padding: 18, width: 380,
      fontFamily: 'sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
    }}>
      {!standalone && <Handle type="target" position={Position.Top} />}

      <NodeHeader
        title="✏ Text Input"
        status={status}
        statusColors={statusColors[status]}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {!collapsed && (
        <>
          <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Your answer / assignment submission
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your answer here..."
            disabled={submitted}
            rows={6}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #ddd', fontSize: 14, marginBottom: 12,
              boxSizing: 'border-box', resize: 'vertical',
              background: submitted ? '#f9f9f9' : '#fff',
              color: submitted ? '#888' : '#1a1a1a',
              lineHeight: 1.6,
            }}
          />

          {!submitted ? (
            <button
              onClick={submit}
              disabled={!text.trim()}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                border: 'none', cursor: !text.trim() ? 'not-allowed' : 'pointer',
                background: !text.trim() ? '#ccc' : '#1D9E75',
                color: '#fff', fontWeight: 600, fontSize: 14,
              }}
            >
              Submit answer
            </button>
          ) : (
            <div>
              <div style={{
                background: '#E1F5EE', borderRadius: 10, padding: '12px 14px',
                fontSize: 13, color: '#085041', fontWeight: 600,
                textAlign: 'center', marginBottom: 8,
              }}>
                ✓ Answer submitted — AI will review it next
              </div>
              <button
                onClick={edit}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 10,
                  border: '1px solid #ddd', background: '#fff',
                  color: '#888', fontSize: 13, cursor: 'pointer',
                }}
              >
                Edit answer
              </button>
            </div>
          )}
        </>
      )}

      {!standalone && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}