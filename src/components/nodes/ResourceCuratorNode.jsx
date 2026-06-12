// src/components/nodes/ResourceCuratorNode.jsx
import { useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON, searchWeb } from '../../api/geminiApi'

// ─── System prompt — generates SEARCH QUERIES, not fake URLs ──────────────────
const SYSTEM_PROMPT = `You are a learning resource curator for students.
Given a topic, return exactly 4 items as a JSON array.
Each item has:
- searchQuery: string (a specific, well-formed search query to find a great resource on this topic)
- type: string (exactly one of: "video", "article", "doc")
- why: string (one sentence — why this angle/resource helps the student)

Rules:
- Make each searchQuery distinct: e.g. one for a video tutorial, one for official documentation, one for common mistakes/pitfalls, one for practice exercises
- For type "video", the searchQuery should be phrased for YouTube (e.g. "React useEffect hook tutorial")
- For type "article" or "doc", phrase for Google (e.g. "React useEffect official documentation")
- Return ONLY valid JSON array, no extra text, no markdown fences`

// ─── Type badge helper ──────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const map = {
    video:   { label: '▶ Video',   bg: '#FAECE7', color: '#712B13' },
    article: { label: '✦ Article', bg: '#EEEDFE', color: '#3C3489' },
    doc:     { label: '⊞ Docs',    bg: '#E1F5EE', color: '#085041' },
  }
  const style = map[type] || map.article
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px',
      borderRadius: 6, background: style.bg, color: style.color
    }}>
      {style.label}
    </span>
  )
}

// ─── Single resource card ────────────────────────────────────────────────────
function ResourceCard({ resource, index }) {
  const hasLink = resource.url && resource.url !== '#'

  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8,
      padding: '10px 12px', background: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#7F77DD', color: '#fff',
          fontSize: 10, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {index + 1}
        </span>
        <TypeBadge type={resource.type} />
      </div>

      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.4 }}>
        {resource.title || resource.searchQuery}
      </p>

      <p style={{ fontSize: 11, color: '#888', marginBottom: 8, lineHeight: 1.5 }}>
        {resource.why}
      </p>

      {hasLink ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 11, color: '#7F77DD', textDecoration: 'none',
            fontWeight: 500, wordBreak: 'break-all'
          }}
        >
          Open resource ↗
        </a>
      ) : (
        <span style={{ fontSize: 11, color: '#bbb' }}>
          No link found
        </span>
      )}
    </div>
  )
}

// ─── Main node ────────────────────────────────────────────────────────────────
export default function ResourceCuratorNode({ id, data }) {
  const { nodeOutputs, setOutput, setStatus, nodeStatus, activeTopic } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [topic, setTopic] = useState(existingOutput?.topic || activeTopic || data?.topic || '')
  const [resources, setResources] = useState(existingOutput?.resources || [])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(existingOutput?.reviewed || false)

  const status = nodeStatus[id] || 'pending'

  // ─── FIX 1: auto-fill topic whenever activeTopic changes ────────────────────
  // Runs even if this node was already rendered before StartNode was set
  useEffect(() => {
    if (activeTopic && !done) {
      setTopic(activeTopic)
    }
  }, [activeTopic,done])

  // ─── FIX 2: generate search queries with AI, then get REAL links via Serper ─
  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setResources([])
    setStatus(id, 'running')

    try {
      // Step 1 — AI generates 4 targeted search queries
      setLoadingStep('Thinking of the best resources...')
      const queries = await callGeminiJSON(SYSTEM_PROMPT, `Topic: ${topic}`)

      // Step 2 — For each query, fetch a REAL result via Serper
      setLoadingStep('Searching the web for real links...')
      const results = await Promise.all(
        queries.map(async (q) => {
          try {
            const searchResults = await searchWeb(q.searchQuery, 1)

            // Prefer video results for video type, else organic
            const best = q.type === 'video'
              ? (searchResults.videos[0] || searchResults.organic[0])
              : (searchResults.organic[0] || searchResults.videos[0])

            return {
              ...q,
              title: best?.title || q.searchQuery,
              url: best?.url || '#'
            }
          } catch (e) {
            // If search fails for one item, don't break the whole node
            return { ...q, title: q.searchQuery, url: '#' }
          }
        })
      )

      setResources(results)
      setOutput(id, { topic, resources: results })
      setStatus(id, 'done')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to fetch resources. Check console for details.')
      setStatus(id, 'failed')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  function markDone() {
    setDone(true)
    setOutput(id, { topic, resources, reviewed: true })
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
      border: `1.5px solid ${status === 'done' ? '#5DCAA5' : '#AFA9EC'}`,
      borderRadius: 12,
      padding: 16,
      width: 300,
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
            Resource Curator
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
          {loading ? (loadingStep || 'Working...') : 'Find best resources'}
        </button>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#E24B4A', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          ⚠ {error}
        </p>
      )}

      {/* Resource cards */}
      {resources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>
            {resources.length} resources found for "{topic}"
          </p>
          {resources.map((r, i) => (
            <ResourceCard key={i} resource={r} index={i} />
          ))}
        </div>
      )}

      {/* Done button */}
      {resources.length > 0 && !done && (
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