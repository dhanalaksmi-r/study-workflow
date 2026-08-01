// src/components/nodes/StartNode.jsx
import { useState } from 'react'

export default function StartNode({ id, topic: initialTopic, onTopicChange, onNext }) {
  const [topic, setTopic] = useState(initialTopic || '')
  const [submitted, setSubmitted] = useState(!!initialTopic)

  function handleSubmit() {
    if (topic.trim()) {
      onTopicChange?.(topic)
      setSubmitted(true)
    }
  }

  function handleEdit() {
    setSubmitted(false)
  }

  function handleNext() {
    onNext?.()
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '2px solid #7F77DD',
      padding: 20,
      width: '100%',
      maxWidth: 520
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        🎯 Assigned Topic
      </h3>
      

      {submitted ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            background: '#E1F5EE',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #5DCAA5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: 13, color: '#0F6E56', fontWeight: 500, marginBottom: 4 }}>
                Topic 
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#085041' }}>
                {topic}
              </p>
            </div>
            
          </div>

          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#1D9E75',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Next step →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., React Hooks, Python Basics, Machine Learning..."
            onKeyPress={e => e.key === 'Enter' && handleSubmit()}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!topic.trim()}
            style={{
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: !topic.trim() ? '#ccc' : '#7F77DD',
              color: '#fff',
              fontWeight: 600,
              cursor: !topic.trim() ? 'not-allowed' : 'pointer',
              opacity: !topic.trim() ? 0.6 : 1
            }}
          >
            Set Topic
          </button>
        </div>
      )}
    </div>
  )
}