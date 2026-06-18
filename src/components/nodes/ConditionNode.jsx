// src/components/nodes/ConditionNode.jsx
import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'

export default function ConditionNode({ id, data, standalone }) {
  const {
    nodeOutputs, setOutput, setStatus, nodeStatus,
    lastScore, edges, setEdges
  } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [threshold, setThreshold] = useState(existingOutput?.threshold ?? data?.threshold ?? 70)
  const [branch, setBranch] = useState(existingOutput?.branch || null)

  const status = nodeStatus[id] || 'pending'
  const score = lastScore

  // ─── The core decision logic ────────────────────────────────────────────────
  function evaluate() {
    if (score === null || score === undefined) return

    const result = score >= threshold ? 'pass' : 'retry'
    setBranch(result)
    setStatus(id, 'done')
    setOutput(id, { score, threshold, branch: result })

    // Highlight the matching edge (green/red), dim the other one
    const updatedEdges = edges.map(edge => {
      if (edge.source !== id) return edge // only touch edges coming OUT of this node

      const isMatch = edge.sourceHandle === result
      return {
        ...edge,
        animated: isMatch,
        style: {
          stroke: isMatch ? (result === 'pass' ? '#1D9E75' : '#E24B4A') : '#ddd',
          strokeWidth: isMatch ? 3 : 1,
          opacity: isMatch ? 1 : 0.35,
        },
        labelStyle: {
          fill: isMatch ? (result === 'pass' ? '#085041' : '#712B13') : '#bbb',
          fontWeight: isMatch ? 600 : 400,
        }
      }
    })
    setEdges(updatedEdges)
  }

  function reset() {
    setBranch(null)
    setStatus(id, 'pending')
    setOutput(id, { threshold, branch: null })

    // Reset edges back to neutral
    const resetEdges = edges.map(edge => {
      if (edge.source !== id) return edge
      return {
        ...edge,
        animated: false,
        style: { stroke: '#ddd', strokeWidth: 1, opacity: 1 },
        labelStyle: { fill: '#bbb', fontWeight: 400 },
      }
    })
    setEdges(resetEdges)
  }

  const borderColor = branch === 'pass' ? '#5DCAA5' : branch === 'retry' ? '#F0997B' : '#AFA9EC'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 12, padding: 16, width: 260,
      fontFamily: 'sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {!standalone && <Handle type="target" position={Position.Top} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>
          ◆ Condition / Branch
        </span>
        {branch && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 6,
            background: branch === 'pass' ? '#E1F5EE' : '#FAECE7',
            color: branch === 'pass' ? '#085041' : '#712B13',
            fontWeight: 500, textTransform: 'uppercase'
          }}>
            {branch}
          </span>
        )}
      </div>

      {/* Threshold config */}
      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
        Pass threshold (%)
      </label>
      <input
        type="number" min="0" max="100"
        value={threshold}
        onChange={e => setThreshold(Number(e.target.value))}
        disabled={branch !== null}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: '1px solid #ddd', fontSize: 13, marginBottom: 10, boxSizing: 'border-box',
          background: branch !== null ? '#f9f9f9' : '#fff',
          color: branch !== null ? '#888' : '#1a1a1a',
        }}
      />

      {/* Score readout */}
      <div style={{
        background: '#f5f5f5', borderRadius: 8, padding: '8px 12px',
        fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'center',
      }}>
        Latest quiz score: <strong>{score !== null && score !== undefined ? `${score}%` : 'no quiz yet'}</strong>
      </div>

      {/* Evaluate / Result */}
      {branch === null ? (
        <button
          onClick={evaluate}
          disabled={score === null || score === undefined}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
            cursor: (score === null || score === undefined) ? 'not-allowed' : 'pointer',
            background: (score === null || score === undefined) ? '#ccc' : '#7F77DD',
            color: '#fff', fontWeight: 500, fontSize: 13,
          }}
        >
          Evaluate score
        </button>
      ) : (
        <>
          <div style={{
            background: branch === 'pass' ? '#E1F5EE' : '#FAECE7',
            border: `1px solid ${branch === 'pass' ? '#5DCAA5' : '#F0997B'}`,
            borderRadius: 8, padding: '10px 12px', textAlign: 'center', marginBottom: 8,
          }}>
            <p style={{
              fontSize: 13, fontWeight: 600,
              color: branch === 'pass' ? '#085041' : '#712B13', marginBottom: 2,
            }}>
              {branch === 'pass' ? '✓ PASS' : '↺ RETRY'}
            </p>
            <p style={{ fontSize: 11, color: '#888' }}>
              {score}% {branch === 'pass' ? '≥' : '<'} {threshold}% threshold
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              width: '100%', padding: '6px 0', borderRadius: 8,
              border: '1px solid #ddd', background: '#fff',
              color: '#888', fontWeight: 500, fontSize: 12, cursor: 'pointer',
            }}
          >
            Re-evaluate
          </button>
        </>
      )}

      {/* Two named source handles — wired to different edges in WorkflowCanvas */}
      {!standalone && (
        <>
          <Handle
            type="source" id="retry" position={Position.Bottom}
            style={{ left: '25%', background: '#E24B4A' }}
          />
          <Handle
            type="source" id="pass" position={Position.Bottom}
            style={{ left: '75%', background: '#1D9E75' }}
          />
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa', marginTop: 4 }}>
        <span>↙ retry</span>
        <span>pass ↘</span>
      </div>
    </div>
  )
}