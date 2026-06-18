
// src/components/nodes/QuizGeneratorNode.jsx
import { useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON } from '../../api/geminiApi'
import NodeHeader from './shared/NodeHeader'
import ScrollArea from './shared/ScrollArea'   // only if the node has a list
// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a quiz generator for students.
Given a topic, return exactly 5 multiple choice questions as a JSON array.
Each question has:
- question: string
- options: array of exactly 4 strings
- correctIndex: number (0-3, index of the correct option)
- explanation: string (1 sentence explaining why the correct answer is right)

Rules:
- Mix difficulty: include recall, application, and analysis questions
- Make incorrect options plausible, not obviously wrong
- Cover different aspects/subtopics of the main topic (this matters for gap analysis later)
- Return ONLY valid JSON array, no extra text, no markdown fences`

// ─── Single question ──────────────────────────────────────────────────────────
function QuestionBlock({ q, index, selected, onSelect, submitted }) {
  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8,
      padding: '12px 14px', background: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#1D9E75', color: '#fff',
          fontSize: 10, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1,
        }}>
          {index + 1}
        </span>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.5 }}>
          {q.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 28 }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correctIndex
          const showResult = submitted

          let bg = '#fff', border = '#ddd', color = '#444'
          if (showResult && isCorrect) {
            bg = '#E1F5EE'; border = '#5DCAA5'; color = '#085041'
          } else if (showResult && isSelected && !isCorrect) {
            bg = '#FAECE7'; border = '#F0997B'; color = '#712B13'
          } else if (!showResult && isSelected) {
            bg = '#EEEDFE'; border = '#AFA9EC'; color = '#3C3489'
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && onSelect(i)}
              disabled={submitted}
              style={{
                textAlign: 'left', padding: '8px 12px', borderRadius: 7,
                border: `1px solid ${border}`, background: bg, color,
                fontSize: 12, cursor: submitted ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `1.5px solid ${border}`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>
                {showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : ''}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {submitted && (
        <p style={{ fontSize: 11, color: '#888', marginTop: 8, marginLeft: 28, lineHeight: 1.5 }}>
          💡 {q.explanation}
        </p>
      )}
    </div>
  )
}

// ─── Main node ────────────────────────────────────────────────────────────────
export default function QuizGeneratorNode({ id, data, standalone }) {
  const { nodeOutputs, setOutput, setStatus, nodeStatus, activeTopic, setScore } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [topic, setTopic] = useState(existingOutput?.topic || activeTopic || data?.topic || '')
  const [questions, setQuestions] = useState(existingOutput?.questions || [])
  const [answers, setAnswers] = useState(existingOutput?.answers || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(existingOutput?.submitted || false)
  const [score, setLocalScore] = useState(existingOutput?.score ?? null)
  const [collapsed, setCollapsed] = useState(false)
  const status = nodeStatus[id] || 'pending'

  // Auto-sync topic from StartNode
  useEffect(() => {
    if (activeTopic && !submitted) {
      setTopic(activeTopic)
    }
  }, [activeTopic, submitted])

  // Re-sync local state whenever this node's output is reset externally
  useEffect(() => {
  const out = nodeOutputs[id]
  if (out) {
    setQuestions(out.questions ?? [])
    setAnswers(out.answers ?? {})
    setSubmitted(out.submitted ?? false)
    setLocalScore(out.score ?? null)
    if (out.topic) setTopic(out.topic)
  }
  }, [nodeOutputs[id]])

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setQuestions([])
    setAnswers({})
    setSubmitted(false)
    setLocalScore(null)
    setStatus(id, 'running')

    try {
      const result = await callGeminiJSON(SYSTEM_PROMPT, `Topic: ${topic}`)
      setQuestions(result)
      setOutput(id, { topic, questions: result, answers: {}, submitted: false, score: null })
      setStatus(id, 'done')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to generate quiz.')
      setStatus(id, 'failed')
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(qIndex, optIndex) {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }))
  }

  function submitQuiz() {
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++
    })
    const pct = Math.round((correct / questions.length) * 100)

    setSubmitted(true)
    setLocalScore(pct)

    // Store score globally — ConditionNode (Day 8) reads this
    setScore(id, pct)

    setOutput(id, {
      topic, questions, answers, submitted: true, score: pct,
      correctCount: correct, totalCount: questions.length
    })
  }

  function retakeQuiz() {
    setAnswers({})
    setSubmitted(false)
    setLocalScore(null)
    setOutput(id, { topic, questions, answers: {}, submitted: false, score: null })
  }

  const allAnswered = questions.length > 0 &&
    Object.keys(answers).length === questions.length

  const statusColors = {
    pending: { bg: '#f5f5f5', color: '#888' },
    running: { bg: '#FAEEDA', color: '#633806' },
    done:    { bg: '#E1F5EE', color: '#085041' },
    failed:  { bg: '#FAECE7', color: '#712B13' },
  }
  const sc = statusColors[status]

  // Score color
  const scoreColor = score === null ? '#888'
    : score >= 70 ? '#1D9E75'
    : '#E24B4A'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${status === 'done' ? '#5DCAA5' : '#7FBDA8'}`,
      borderRadius: 12,
      padding: 16,
      width: 380,
      fontFamily: 'sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      {!standalone && <Handle type="target" position={Position.Top} />}

      {/* Header */}
      <NodeHeader
      badge="AI NODE"                                    // or omit for non-AI nodes
      badgeColor={{ bg: '#E1F5EE', color: '#085041' }}   // match node's color theme
      title="Quiz Generator"                         // node's title
      status={status}
      statusColors={statusColors[status]}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {/* Topic input */}
      {!collapsed && (
        <>
      {questions.length === 0 && (
        <>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>
            Topic
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="e.g. React Hooks, Photosynthesis..."
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 13, marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 8,
              border: 'none', cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              background: loading || !topic.trim() ? '#ccc' : '#1D9E75',
              color: '#fff', fontWeight: 500, fontSize: 13, marginBottom: 12,
            }}
          >
            {loading ? 'Generating quiz...' : 'Generate quiz (5 questions)'}
          </button>
        </>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#E24B4A', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          ⚠ {error}
        </p>
      )}

      {/* Score banner (after submit) */}
      {submitted && score !== null && (
        <div style={{
          background: score >= 70 ? '#E1F5EE' : '#FAECE7',
          border: `1px solid ${score >= 70 ? '#5DCAA5' : '#F0997B'}`,
          borderRadius: 8, padding: '12px 14px', marginBottom: 12,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: scoreColor, marginBottom: 2 }}>
            {score}%
          </p>
          <p style={{ fontSize: 12, color: score >= 70 ? '#085041' : '#712B13' }}>
            {score >= 70
              ? '✓ Great job — you can advance to the next topic'
              : '⚠ Below 70% — workflow will route you back to review weak areas'}
          </p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <ScrollArea maxHeight={400}>
          {questions.map((q, i) => (
            <QuestionBlock
              key={i}
              q={q}
              index={i}
              selected={answers[i]}
              onSelect={(opt) => selectAnswer(i, opt)}
              submitted={submitted}
            />
          ))}
        </ScrollArea>
      )}

      {/* Submit / Retake buttons */}
      {questions.length > 0 && !submitted && (
        <button
          onClick={submitQuiz}
          disabled={!allAnswered}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: 'none', cursor: allAnswered ? 'pointer' : 'not-allowed',
            background: allAnswered ? '#1D9E75' : '#ccc',
            color: '#fff', fontWeight: 500, fontSize: 14,
          }}
        >
          {allAnswered
            ? 'Submit quiz'
            : `Answer all questions (${Object.keys(answers).length}/${questions.length})`}
        </button>
      )}

      {submitted && (
        <button
          onClick={retakeQuiz}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            border: '1.5px solid #AFA9EC', background: '#fff',
            color: '#7F77DD', fontWeight: 500, fontSize: 14, cursor: 'pointer',
          }}
        >
          Retake quiz
        </button>
      )}
      </>
      )}
      {!standalone && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}