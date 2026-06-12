// src/components/nodes/StartNode.jsx
import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'

export default function StartNode({ id, data }) {
  const { setOutput, setActiveTopic } = useWorkflowStore()
  const [topic, setTopic] = useState(data?.topic || '')
  const [saved, setSaved] = useState(false)

  function saveTopic() {
    if (!topic.trim()) return
    setOutput(id, { topic })
    setActiveTopic(topic)
    setSaved(true)
  }

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${saved ? '#5DCAA5' : '#888'}`,
      borderRadius: 10,
      padding: 12,
      minWidth: 220,
      fontFamily: 'sans-serif',
      fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <p style={{ fontWeight: 600, marginBottom: 8, color: '#444' }}>▶ Start</p>

      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
        Topic
      </label>
      <input
        value={topic}
        onChange={e => { setTopic(e.target.value); setSaved(false) }}
        onKeyDown={e => e.key === 'Enter' && saveTopic()}
        placeholder="e.g. React Hooks, Photosynthesis..."
        style={{
          width: '100%', padding: '6px 10px', borderRadius: 7,
          border: '1px solid #ddd', fontSize: 12,
          marginBottom: 8, boxSizing: 'border-box',
        }}
      />

      <button
        onClick={saveTopic}
        disabled={!topic.trim()}
        style={{
          width: '100%', padding: '6px 0', borderRadius: 7,
          border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          background: saved ? '#1D9E75' : '#7F77DD',
          color: '#fff',
        }}
      >
        {saved ? '✓ Topic saved' : 'Set topic'}
      </button>

      {saved && (
        <p style={{ fontSize: 11, color: '#1D9E75', marginTop: 6, textAlign: 'center' }}>
          Resource Curator will auto-fill "{topic}"
        </p>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}