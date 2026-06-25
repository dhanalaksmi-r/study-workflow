// src/components/nodes/WeakSpotDetectorNode.jsx
import { useState } from 'react'

const callGemini = async (systemPrompt, userMessage) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  })
  
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

export default function WeakSpotDetectorNode({ id, topic, quizAnswers, quizQuestions, onLoopBack }) {
  const [loading, setLoading] = useState(false)
  const [gap, setGap] = useState(null)
  const [error, setError] = useState('')

  async function analyzeGap() {
    setLoading(true)
    setError('')

    try {
      if (!quizQuestions || !quizAnswers) {
        throw new Error('Quiz data not available')
      }

      // Identify wrong answers
      const wrongAnswers = []
      quizQuestions.forEach((q, i) => {
        if (quizAnswers[i] !== q.correctIndex) {
          wrongAnswers.push({
            question: q.question,
            studentAnswer: q.options[quizAnswers[i]],
            correctAnswer: q.options[q.correctIndex],
            explanation: q.explanation
          })
        }
      })

      if (wrongAnswers.length === 0) {
        throw new Error('No wrong answers found')
      }

      // AI analyzes the gap
      const systemPrompt = `You are an expert learning analyst. Given a student's wrong quiz answers, identify the most critical knowledge gap.
Return ONLY a valid JSON object with this format:
{
  "subtopic": "specific topic name",
  "confidence": 85,
  "recommendation": "brief recommendation on how to improve"
}
Focus on the PRIMARY gap that caused the most wrong answers.`

      const userMessage = `Topic: ${topic}

Wrong answers:
${wrongAnswers.map((w, i) => `${i + 1}. Q: ${w.question}
   Student said: ${w.studentAnswer}
   Correct: ${w.correctAnswer}
   Explanation: ${w.explanation}`).join('\n\n')}`

      const response = await callGemini(systemPrompt, userMessage)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setGap(parsed)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        🔍 Analyse Gaps
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        AI identifies exactly what to revisit.
      </p>

      {error && (
        <div style={{
          background: '#FAECE7', border: '1px solid #F0997B',
          borderRadius: 10, padding: 12, marginBottom: 16,
          fontSize: 13, color: '#712B13'
        }}>
          ⚠ {error}
        </div>
      )}

      {!gap ? (
        <button
          onClick={analyzeGap}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: 'none',
            background: '#7F77DD',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Analysing...' : 'Analyse my weak spot'}
        </button>
      ) : (
        <div>
          <div style={{
            background: '#FFF3E0',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            border: '1px solid #EF9F27'
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#633806', marginBottom: 8 }}>
              🎯 DETECTED GAP
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#633806', marginBottom: 8 }}>
              {gap.subtopic}
            </p>
            <p style={{ fontSize: 12, color: '#854F0B', lineHeight: 1.6, marginBottom: 12 }}>
              {gap.recommendation}
            </p>
            <p style={{ fontSize: 11, color: '#854F0B' }}>
              AI Confidence: {gap.confidence}%
            </p>
          </div>

          <button
            onClick={() => onLoopBack?.(gap.subtopic)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#7F77DD',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ↺ Loop Back → Focus on {gap.subtopic}
          </button>
        </div>
      )}
    </div>
  )
}