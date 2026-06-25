// src/components/nodes/ResourceCuratorNode.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

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

const searchSerper = async (query) => {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': import.meta.env.VITE_SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: query, num: 3 })
  })
  
  const data = await response.json()
  return data.organic || []
}

export default function ResourceCuratorNode({ id, topic, onComplete }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reviewed, setReviewed] = useState({})

  async function generateResources() {
    setLoading(true)
    setError('')

    try {
      if (!topic) {
        throw new Error('Topic not set. Go to StartNode and set a topic first.')
      }

      // Step 1: AI suggests search queries
      const systemPrompt = `You are an expert learning resource curator. 
Given a topic, suggest 4 search queries to find the best learning resources.
Return ONLY a JSON array of 4 objects with format: [{"query": "...", "type": "...", "why": "..."}]
Types: 'video', 'article', 'documentation', 'tutorial'`

      const response = await callGemini(systemPrompt, `Topic: ${topic}`)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      const queries = JSON.parse(cleaned)

      // Step 2: Search for each query
      const resourceList = []
      for (const item of queries) {
        const results = await searchSerper(item.query)
        if (results.length > 0) {
          const first = results[0]
          resourceList.push({
            title: first.title,
            description: first.snippet,
            link: first.link,
            type: item.type,
            why: item.why
          })
        }
      }

      setResources(resourceList)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function toggleReviewed(index) {
    setReviewed(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const allReviewed = resources.length > 0 && Object.values(reviewed).filter(Boolean).length === resources.length

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
        📚 Find Resources
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        Topic: <strong>{topic || 'Not set'}</strong>
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

      {resources.length === 0 ? (
        <button
          onClick={generateResources}
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
          {loading ? 'Finding resources...' : 'Find best resources'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resources.map((res, i) => (
            <div key={i} style={{
              background: '#f9f9f9',
              border: '1px solid #eee',
              borderRadius: 10,
              padding: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                    {res.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 6, lineHeight: 1.4 }}>
                    {res.description}
                  </p>
                  <a href={res.link} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 11, color: '#7F77DD', textDecoration: 'none', fontWeight: 600
                  }}>
                    Open link →
                  </a>
                </div>
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4,
                  background: '#EEEDFE', color: '#534AB7', fontWeight: 600,
                  flexShrink: 0, marginLeft: 8
                }}>
                  {res.type}
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={reviewed[i] || false}
                  onChange={() => toggleReviewed(i)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: '#888' }}>Reviewed</span>
              </label>
            </div>
          ))}

          {allReviewed && (
            <button
              onClick={() => onComplete?.({ resources, reviewed })}
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
              Mark as done →
            </button>
          )}
        </div>
      )}
    </div>
  )
}