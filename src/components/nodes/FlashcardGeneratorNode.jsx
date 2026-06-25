// src/components/nodes/FlashcardGeneratorNode.jsx
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
      max_tokens: 1500
    })
  })
  
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

export default function FlashcardGeneratorNode({ id, topic, onComplete }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState({})
  const [reviewed, setReviewed] = useState({})

  async function generateFlashcards() {
    setLoading(true)
    setError('')

    try {
      if (!topic) {
        throw new Error('Topic not set')
      }

      const systemPrompt = `You are an expert educator. Create 6 educational flashcards for the given topic.
Return ONLY a valid JSON array with 6 objects in this format:
[
  {"question": "...", "answer": "...", "difficulty": "easy"},
  ...
]
Difficulties: easy, medium, hard`

      const response = await callGemini(systemPrompt, `Create flashcards for: ${topic}`)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsedCards = JSON.parse(cleaned)
      setCards(parsedCards)
      setCurrentIndex(0)
      setFlipped({})
      setReviewed({})
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function toggleFlip() {
    setFlipped(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }))
  }

  function markReviewed() {
    setReviewed(prev => ({
      ...prev,
      [currentIndex]: true
    }))
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped({})
    }
  }

  function goNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped({})
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setFlipped({})
    }
  }

  const allReviewed = cards.length > 0 && Object.values(reviewed).filter(Boolean).length === cards.length

  if (cards.length === 0) {
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
          🃏 Study Flashcards
        </h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          AI-generated flashcards on: <strong>{topic}</strong>
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
          onClick={generateFlashcards}
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
          {loading ? 'Generating flashcards...' : 'Generate flashcards'}
        </button>
      </div>
    )
  }

  const card = cards[currentIndex]
  const isFlipped = flipped[currentIndex]
  const isReviewedCard = reviewed[currentIndex]

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '2px solid #7F77DD',
      padding: 20,
      width: '100%',
      maxWidth: 520
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
          🃏 Flashcard {currentIndex + 1}/6
        </h3>
        <span style={{
          fontSize: 11,
          padding: '3px 10px',
          borderRadius: 6,
          background: card.difficulty === 'easy' ? '#E1F5EE'
            : card.difficulty === 'medium' ? '#FFF3E0'
            : '#FAECE7',
          color: card.difficulty === 'easy' ? '#085041'
            : card.difficulty === 'medium' ? '#633806'
            : '#712B13',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {card.difficulty}
        </span>
      </div>

      {/* Flip card */}
      <div
        onClick={toggleFlip}
        style={{
          background: isFlipped ? '#EEEDFE' : '#f5f5f5',
          borderRadius: 12,
          padding: 32,
          marginBottom: 16,
          minHeight: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed #ddd',
          transition: 'all 0.3s'
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
            {isFlipped ? 'ANSWER' : 'QUESTION'}
          </p>
          <p style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1a1a1a',
            lineHeight: 1.6
          }}>
            {isFlipped ? card.answer : card.question}
          </p>
          <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
            Click to {isFlipped ? 'hide' : 'reveal'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            color: currentIndex === 0 ? '#ddd' : '#888',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          ← Prev
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: currentIndex === cards.length - 1 ? 'not-allowed' : 'pointer',
            color: currentIndex === cards.length - 1 ? '#ddd' : '#888',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Next →
        </button>
      </div>

      {/* Mark reviewed */}
      <button
        onClick={markReviewed}
        disabled={isReviewedCard}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: 'none',
          background: isReviewedCard ? '#E1F5EE' : '#7F77DD',
          color: isReviewedCard ? '#085041' : '#fff',
          fontWeight: 600,
          fontSize: 13,
          cursor: isReviewedCard ? 'not-allowed' : 'pointer'
        }}
      >
        {isReviewedCard ? '✓ Reviewed' : 'Mark as reviewed'}
      </button>

      {/* Progress bar */}
      <div style={{
        marginTop: 12,
        background: '#f0f0f0',
        borderRadius: 6,
        height: 6,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: '#1D9E75',
          width: `${(Object.values(reviewed).filter(Boolean).length / cards.length) * 100}%`,
          transition: 'width 0.3s'
        }} />
      </div>
      <p style={{
        fontSize: 11,
        color: '#aaa',
        marginTop: 8,
        textAlign: 'center'
      }}>
        {Object.values(reviewed).filter(Boolean).length}/{cards.length} cards reviewed
      </p>

      {/* Mark all done */}
      {allReviewed && (
        <button
          onClick={() => onComplete?.({ cards, reviewed })}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            background: '#1D9E75',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            marginTop: 12,
            boxShadow: '0 4px 12px rgba(29, 158, 117, 0.3)'
          }}
        >
          ✓ All done! Next step →
        </button>
      )}
    </div>
  )
}