// src/components/nodes/WeakSpotDetectorNode.jsx
import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON } from '../../api/geminiApi'

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a learning gap analyser for students.
You will receive a topic and a list of quiz questions with the student's answer and the correct answer for each.

Return a JSON object with:
- weakTopics: array of objects, each with:
  - subtopic: string (a specific concept the student is weak on)
  - confidence: number 0-100 (how confident you are this is a real gap)
  - recommendation: string (one sentence on what to study to fix this gap)
- overallGap: string (one sentence summary of the main weakness)
- shouldRetry: boolean (true if at least one weak topic has confidence >= 50)

Only include subtopics from questions the student got WRONG.
If the student got everything right, return: weakTopics: [], overallGap: "No significant gaps found", shouldRetry: false.
Return ONLY valid JSON object, no extra text, no markdown fences.`

export default function WeakSpotDetectorNode({ id, data, standalone }) {
  const {
    nodeOutputs, setOutput, setStatus, nodeStatus,
    setActiveTopic, setWeakTopics, resetNodeOutput,
    incrementRetry, retryCount,
  } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [result, setResult] = useState(existingOutput?.result || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loopedBack, setLoopedBack] = useState(false)

  const status = nodeStatus[id] || 'pending'

  // ─── Find the submitted quiz to analyse ───────────────────────────────────
  // Search all node outputs for one that has `questions` + `submitted: true`
  const quizEntry = Object.entries(nodeOutputs).find(
    ([, out]) => out?.questions && out?.submitted
  )
  const quizOutput = quizEntry?.[1]
  const quizNodeId = quizEntry?.[0]

  // Find the Resource Curator node — used for loop-back
  const resourceEntry = Object.entries(nodeOutputs).find(
    ([, out]) => out?.resources !== undefined
  )
  const resourceNodeId = resourceEntry?.[0]

  // Find the Flashcard Generator node — also reset on loop-back
  const flashcardEntry = Object.entries(nodeOutputs).find(
    ([, out]) => out?.cards !== undefined
  )
  const flashcardNodeId = flashcardEntry?.[0]

  // ─── AI analysis ────────────────────────────────────────────────────────────
  async function analyse() {
    if (!quizOutput) return
    setLoading(true)
    setError('')
    setStatus(id, 'running')

    try {
      const reviewItems = quizOutput.questions.map((q, i) => ({
        question: q.question,
        studentAnswer: q.options[quizOutput.answers[i]] ?? 'No answer',
        correctAnswer: q.options[q.correctIndex],
        isCorrect: quizOutput.answers[i] === q.correctIndex,
      }))

      const userMessage = JSON.stringify({
        topic: quizOutput.topic,
        items: reviewItems,
      })

      const res = await callGeminiJSON(SYSTEM_PROMPT, userMessage)
      setResult(res)
      setOutput(id, { result: res, topic: quizOutput.topic })
      setWeakTopics(res.weakTopics || [])
      setStatus(id, 'done')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to analyse weak spots.')
      setStatus(id, 'failed')
    } finally {
      setLoading(false)
    }
  }

  // ─── Loop back: send a focused topic back to Resource Curator ────────────────
  function loopBack(subtopic) {
    if (!resourceNodeId) return

    // 1. Update the global active topic — every node syncs to this
    setActiveTopic(subtopic)

    // 2. Reset Resource Curator so it re-runs with the focused subtopic
    resetNodeOutput(resourceNodeId, { topic: subtopic, resources: [], reviewed: false })

    // 3. Reset Flashcard Generator too, if it exists
    if (flashcardNodeId) {
      resetNodeOutput(flashcardNodeId, { topic: subtopic, cards: [], reviewed: false })
    }

    // 4. Reset the Quiz so the student retakes it on the new subtopic
    if (quizNodeId) {
      resetNodeOutput(quizNodeId, {
        topic: subtopic, questions: [], answers: {}, submitted: false, score: null
      })
    }

    incrementRetry()
    setLoopedBack(true)
  }

  const statusColors = {
    pending: { bg: '#f5f5f5', color: '#888' },
    running: { bg: '#FAEEDA', color: '#633806' },
    done:    { bg: '#E1F5EE', color: '#085041' },
    failed:  { bg: '#FAECE7', color: '#712B13' },
  }
  const sc = statusColors[status]

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${status === 'done' ? '#EF9F27' : '#F5C99B'}`,
      borderRadius: 12, padding: 16, width: 300,
      fontFamily: 'sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {!standalone && <Handle type="target" position={Position.Top} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: '#FAEEDA', color: '#633806',
            borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 500,
          }}>
            AI NODE
          </span>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>
            Weak Spot Detector
          </span>
        </div>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 6,
          background: sc.bg, color: sc.color, fontWeight: 500, textTransform: 'uppercase'
        }}>
          {status}
        </span>
      </div>

      {/* No quiz yet */}
      {!quizOutput && (
        <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>
          Waiting for a submitted quiz to analyse. Complete the Quiz Generator node first.
        </p>
      )}

      {/* Analyse button */}
      {quizOutput && !result && (
        <button
          onClick={analyse}
          disabled={loading}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#ccc' : '#EF9F27',
            color: '#fff', fontWeight: 500, fontSize: 13,
          }}
        >
          {loading ? 'Analysing your answers...' : `Analyse quiz (score: ${quizOutput.score}%)`}
        </button>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#E24B4A', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>⚠ {error}</p>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            background: '#FAEEDA', borderRadius: 8, padding: '8px 12px',
            fontSize: 12, color: '#633806', lineHeight: 1.5,
          }}>
            {result.overallGap}
          </div>

          {result.weakTopics?.length > 0 ? (
            result.weakTopics.map((w, i) => (
              <div key={i} style={{
                border: '1px solid #F5C99B', borderRadius: 8,
                padding: '10px 12px', background: '#FFFBF5',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#712B13' }}>{w.subtopic}</span>
                  <span style={{ fontSize: 10, color: '#aaa' }}>{w.confidence}% confidence</span>
                </div>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 8, lineHeight: 1.5 }}>
                  {w.recommendation}
                </p>
                {!loopedBack && (
                  <button
                    onClick={() => loopBack(w.subtopic)}
                    style={{
                      width: '100%', padding: '6px 0', borderRadius: 6,
                      border: '1px solid #7F77DD', background: '#fff',
                      color: '#7F77DD', fontWeight: 500, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    ↺ Loop back to Resource Curator with this topic
                  </button>
                )}
              </div>
            ))
          ) : (
            <div style={{
              background: '#E1F5EE', borderRadius: 8, padding: '10px 12px',
              fontSize: 12, color: '#085041', textAlign: 'center',
            }}>
              ✓ No significant gaps found
            </div>
          )}

          {loopedBack && (
            <div style={{
              background: '#EEEDFE', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: '#3C3489', textAlign: 'center', lineHeight: 1.5,
            }}>
              ↺ Sent back — scroll up to Resource Curator, the topic is now
              focused on the gap (retry #{retryCount})
            </div>
          )}
        </div>
      )}

      {!standalone && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}