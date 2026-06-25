// src/components/nodes/QuizGeneratorNode.jsx
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
      max_tokens: 2000
    })
  })
  
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

export default function QuizGeneratorNode({ id, topic, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)

  async function generateQuiz() {
    setLoading(true)
    setError('')
    setSubmitted(false)
    setAnswers({})
    setScore(null)

    try {
      if (!topic) {
        throw new Error('Topic not set')
      }

      const systemPrompt = `You are an expert educator. Create 5 multiple choice questions for the given topic.
Return ONLY a valid JSON array with 5 objects in this format:
[
  {
    "question": "...",
    "options": ["option1", "option2", "option3", "option4"],
    "correctIndex": 0,
    "explanation": "..."
  },
  ...
]
The correctIndex is 0-3 indicating which option is correct (0-based index).`

      const response = await callGemini(systemPrompt, `Create a quiz for: ${topic}`)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsedQuestions = JSON.parse(cleaned)
      setQuestions(parsedQuestions)
      setAnswers({})
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionIndex, optionIndex) {
    if (!submitted) {
      setAnswers(prev => ({
        ...prev,
        [questionIndex]: optionIndex
      }))
    }
  }

  function submitQuiz() {
    if (Object.keys(answers).length !== questions.length) {
      setError('Please answer all questions before submitting')
      return
    }

    // Calculate score
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) {
        correct++
      }
    })

    const percentage = Math.round((correct / questions.length) * 100)
    setScore({ correct, total: questions.length, percentage })
    setSubmitted(true)
  }

  function retakeQuiz() {
    setAnswers({})
    setScore(null)
    setSubmitted(false)
  }

  if (questions.length === 0) {
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
          📝 Take the Quiz
        </h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          Test your understanding of <strong>{topic}</strong>
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

        <button
          onClick={generateQuiz}
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
          {loading ? 'Generating quiz...' : 'Generate quiz'}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '2px solid #7F77DD',
      padding: 20,
      width: '100%',
      maxWidth: 520,
      maxHeight: '70vh',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        position: 'sticky',
        top: 0,
        background: '#fff',
        paddingBottom: 12,
        borderBottom: '1px solid #eee'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
          📝 Quiz
        </h3>
        {score && (
          <div style={{
            fontSize: 24,
            fontWeight: 800,
            color: score.percentage >= 70 ? '#1D9E75' : '#E24B4A'
          }}>
            {score.percentage}%
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: '#FAECE7', border: '1px solid #F0997B',
          borderRadius: 10, padding: 12, marginBottom: 16,
          fontSize: 13, color: '#712B13'
        }}>
          ⚠ {error}
        </div>
      )}

      {!submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, qIndex) => (
            <div key={qIndex} style={{
              borderBottom: qIndex < questions.length - 1 ? '1px solid #eee' : 'none',
              paddingBottom: 16
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>
                Q{qIndex + 1}: {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((option, oIndex) => (
                  <label key={oIndex} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    background: answers[qIndex] === oIndex ? '#EEEDFE' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name={`q${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => handleAnswer(qIndex, oIndex)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: '#1a1a1a' }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length !== questions.length}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: Object.keys(answers).length === questions.length ? '#7F77DD' : '#ccc',
              color: '#fff',
              fontWeight: 600,
              cursor: Object.keys(answers).length === questions.length ? 'pointer' : 'not-allowed',
              marginTop: 8
            }}
          >
            Submit Quiz
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            background: score.percentage >= 70 ? '#E1F5EE' : '#FAECE7',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            textAlign: 'center',
            border: `1px solid ${score.percentage >= 70 ? '#5DCAA5' : '#F0997B'}`
          }}>
            <p style={{
              fontSize: 12,
              color: score.percentage >= 70 ? '#0F6E56' : '#712B13',
              fontWeight: 600,
              marginBottom: 8
            }}>
              {score.percentage >= 70 ? 'PASS ✓' : 'NEEDS IMPROVEMENT'}
            </p>
            <p style={{
              fontSize: 20,
              fontWeight: 800,
              color: score.percentage >= 70 ? '#1D9E75' : '#E24B4A',
              marginBottom: 4
            }}>
              {score.correct}/{score.total}
            </p>
            <p style={{
              fontSize: 13,
              color: score.percentage >= 70 ? '#0F6E56' : '#712B13'
            }}>
              {score.percentage}% correct
            </p>
          </div>

          {/* Show answers review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {questions.map((q, qIndex) => {
              const isCorrect = answers[qIndex] === q.correctIndex
              return (
                <div key={qIndex} style={{
                  background: isCorrect ? '#E1F5EE' : '#FAECE7',
                  borderRadius: 10,
                  padding: 12,
                  border: `1px solid ${isCorrect ? '#5DCAA5' : '#F0997B'}`
                }}>
                  <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isCorrect ? '#085041' : '#712B13',
                    marginBottom: 6
                  }}>
                    Q{qIndex + 1}: {isCorrect ? '✓' : '✗'}
                  </p>
                  <p style={{ fontSize: 12, color: '#1a1a1a', marginBottom: 6 }}>
                    Your answer: <strong>{q.options[answers[qIndex]]}</strong>
                  </p>
                  {!isCorrect && (
                    <p style={{ fontSize: 12, color: '#1a1a1a', marginBottom: 6 }}>
                      Correct: <strong>{q.options[q.correctIndex]}</strong>
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: isCorrect ? '#0F6E56' : '#712B13' }}>
                    {q.explanation}
                  </p>
                </div>
              )
            })}
          </div>

          {score.percentage >= 70 ? (
            <button
              onClick={() => onComplete?.({ score: score.percentage, questions, answers })}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#1D9E75',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={() => onComplete?.({ score: score.percentage, questions, answers })}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#EF9F27',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Check Score →
            </button>
          )}
        </div>
      )}
    </div>
  )
}