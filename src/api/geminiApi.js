// src/api/geminiApi.js
// Groq for AI text/JSON generation + Serper for real search results

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY
const SERPER_URL = 'https://google.serper.dev/search'

// ─── Core Groq call ─────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userMessage) {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY missing from .env')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error?.message || 'Groq API call failed')
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ─── JSON helper — strips markdown fences and parses ────────────────────────
export async function callGeminiJSON(systemPrompt, userMessage) {
  const raw = await callGroq(systemPrompt, userMessage)

  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(clean)
  } catch (e) {
    console.error('Failed to parse JSON:', clean)
    throw new Error('AI returned invalid JSON. Check your system prompt.')
  }
}

// ─── Text helper — plain text response ───────────────────────────────────────
export async function callGeminiText(systemPrompt, userMessage) {
  return await callGroq(systemPrompt, userMessage)
}

// ─── Real web search via Serper ──────────────────────────────────────────────
// Returns REAL, working URLs from Google search results
export async function searchWeb(query, numResults = 1) {
  if (!SERPER_API_KEY) throw new Error('VITE_SERPER_API_KEY missing from .env')

  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: query, num: numResults })
  })

  if (!res.ok) throw new Error('Serper search API failed')

  const data = await res.json()

  // For video queries, prefer videos array if present, else organic results
  const organic = data.organic || []
  const videos = data.videos || []

  return {
    organic: organic.slice(0, numResults).map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet || ''
    })),
    videos: videos.slice(0, numResults).map(v => ({
      title: v.title,
      url: v.link,
      snippet: v.snippet || ''
    }))
  }
}