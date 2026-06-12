
// src/components/nodes/FlashcardGeneratorNode.jsx
import { useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON } from '../../api/geminiApi'

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a flashcard generator for students.
Given a topic, return exactly 6 flashcards as a JSON array.
Each flashcard has:
- question: string
- answer: string (1-2 sentences max)
- difficulty: string (exactly one of: "easy", "medium", "hard")

Rules:
- Questions should test understanding, not just recall
- Cover different aspects of the topic
- Mix difficulties: roughly 2 easy, 2 medium, 2 hard
- Return ONLY valid JSON array, no extra text, no markdown fences`

// ─── Difficulty styling ────────────────────────────────────────────────────────
const DIFFICULTY_COLORS = {
  easy:   { bg: '#E1F5EE', text: '#085041', border: '#5DCAA5' },
  medium: { bg: '#FAEEDA', text: '#633806', border: '#EF9F27' },
  hard:   { bg: '#FAECE7', text: '#712B13', border: '#F0997B' },
}

// ─── Single flip card ────────────────────────────────────────────────────────
function FlashCard({ card, index }) {
  const [flipped, setFlipped] = useState(false)
  const colors = DIFFICULTY_COLORS[card.difficulty] || DIFFICULTY_COLORS.medium

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        cursor: 'pointer',
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        background: flipped ? colors.bg : '#fff',
        minHeight: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'background 0.2s',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: '#7F77DD', color: '#fff',
          fontSize: 9, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {index + 1}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '2px 8px',
          borderRadius: 6, background: colors.bg, color: colors.text,
          border: `1px solid ${colors.border}`,
        }}>
          {card.difficulty}
        </span>
        <span style={{ color: '#aaa', fontSize: 10, marginLeft: 'auto' }}>
          {flipped ? 'Answer' : 'Question'} · tap to flip
        </span>
      </div>

      <p style={{
        fontSize: 13,
        lineHeight: 1.5,
        color: flipped ? colors.text : '#1a1a1a',
        fontWeight: flipped ? 400 : 500,
        margin: 0,
      }}>
        {flipped ? card.answer : card.question}
      </p>
    </div>
  )
}

// ─── Main node ────────────────────────────────────────────────────────────────
export default function FlashcardGeneratorNode({ id, data }) {
  const { nodeOutputs, setOutput, setStatus, nodeStatus, activeTopic } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [topic, setTopic] = useState(existingOutput?.topic || activeTopic || data?.topic || '')
  const [cards, setCards] = useState(existingOutput?.cards || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(existingOutput?.reviewed || false)

  const status = nodeStatus[id] || 'pending'

  // Auto-sync topic from StartNode, same pattern as ResourceCuratorNode
  useEffect(() => {
    if (activeTopic && !done) {
      setTopic(activeTopic)
    }
  }, [activeTopic, done])

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setCards([])
    setStatus(id, 'running')

    try {
      const result = await callGeminiJSON(SYSTEM_PROMPT, `Topic: ${topic}`)
      setCards(result)
      setOutput(id, { topic, cards: result })
      setStatus(id, 'done')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to generate flashcards.')
      setStatus(id, 'failed')
    } finally {
      setLoading(false)
    }
  }

  function markDone() {
    setDone(true)
    setOutput(id, { topic, cards, reviewed: true })
  }

  const statusColors = {
    pending: { bg: '#f5f5f5', color: '#888' },
    running: { bg: '#FAEEDA', color: '#633806' },
    done:    { bg: '#E1F5EE', color: '#085041' },
    failed:  { bg: '#FAECE7', color: '#712B13' },
  }
  const sc = statusColors[status]

  const easyCount   = cards.filter(c => c.difficulty === 'easy').length
  const mediumCount = cards.filter(c => c.difficulty === 'medium').length
  const hardCount   = cards.filter(c => c.difficulty === 'hard').length

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${status === 'done' ? '#5DCAA5' : '#AFA9EC'}`,
      borderRadius: 12,
      padding: 16,
      width: 320,
      fontFamily: 'sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <Handle type="target" position={Position.Top} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#EEEDFE', color: '#3C3489',
            borderRadius: 6, padding: '3px 10px',
            fontSize: 10, fontWeight: 500,
          }}>
            AI NODE
          </span>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>
            Flashcard Generator
          </span>
        </div>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 6,
          background: sc.bg, color: sc.color, fontWeight: 500,
          textTransform: 'uppercase'
        }}>
          {status}
        </span>
      </div>

      {/* Topic input */}
      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
        Topic
      </label>
      <input
        value={topic}
        onChange={e => setTopic(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && generate()}
        placeholder="e.g. React Hooks, Photosynthesis..."
        disabled={done}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: '1px solid #ddd', fontSize: 13, marginBottom: 10,
          boxSizing: 'border-box', background: done ? '#f9f9f9' : '#fff',
          color: done ? '#888' : '#1a1a1a',
        }}
      />

      {/* Generate button */}
      {!done && (
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: 'none', cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
            background: loading || !topic.trim() ? '#ccc' : '#7F77DD',
            color: '#fff', fontWeight: 500, fontSize: 13, marginBottom: 12,
          }}
        >
          {loading ? 'Generating flashcards...' : 'Generate flashcards'}
        </button>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#E24B4A', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          ⚠ {error}
        </p>
      )}

      {/* Stats bar */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, fontSize: 11, flexWrap: 'wrap' }}>
          <span style={{ background: '#E1F5EE', color: '#085041', borderRadius: 6, padding: '2px 8px' }}>
            {easyCount} easy
          </span>
          <span style={{ background: '#FAEEDA', color: '#633806', borderRadius: 6, padding: '2px 8px' }}>
            {mediumCount} medium
          </span>
          <span style={{ background: '#FAECE7', color: '#712B13', borderRadius: 6, padding: '2px 8px' }}>
            {hardCount} hard
          </span>
          <span style={{ color: '#aaa', marginLeft: 'auto' }}>tap to flip</span>
        </div>
      )}

      {/* Flashcards */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {cards.map((c, i) => (
            <FlashCard key={i} card={c} index={i} />
          ))}
        </div>
      )}

      {/* Done button */}
      {cards.length > 0 && !done && (
        <button
          onClick={markDone}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: '1.5px solid #5DCAA5', background: '#fff',
            color: '#1D9E75', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}
        >
          Mark as reviewed → next
        </button>
      )}

      {done && (
        <div style={{
          background: '#E1F5EE', borderRadius: 8, padding: '8px 12px',
          fontSize: 12, color: '#085041', fontWeight: 500, textAlign: 'center'
        }}>
          ✓ Reviewed — workflow can advance
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}