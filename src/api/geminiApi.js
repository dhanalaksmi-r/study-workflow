// src/api/geminiApi.js — Groq version (free, no quota issues)
const API_KEY = import.meta.env.VITE_GROQ_API_KEY
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(systemPrompt, userMessage) {
  if (!API_KEY) throw new Error('VITE_GROQ_API_KEY missing from .env')

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // free, very capable
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

// Use this for all AI nodes that return JSON
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

// Use this for plain text responses
export async function callGeminiText(systemPrompt, userMessage) {
  return await callGroq(systemPrompt, userMessage)
}