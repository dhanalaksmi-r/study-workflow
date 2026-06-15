// src/components/nodes/ResourceCuratorNode.jsx
import { useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useWorkflowStore } from '../../store/workflowStore'
import { callGeminiJSON, searchWeb } from '../../api/geminiApi'
import NodeHeader from './shared/NodeHeader'
import ScrollArea from './shared/ScrollArea'

const SYSTEM_PROMPT = `You are a learning resource curator for students.
Given a topic, return exactly 4 items as a JSON array.
Each item has:
- searchQuery: string (a specific, well-formed search query to find a great resource on this topic)
- type: string (exactly one of: "video", "article", "doc")
- why: string (one sentence — why this angle/resource helps the student)

Rules:
- Make each searchQuery distinct: e.g. one for a video tutorial, one for official documentation, one for common mistakes/pitfalls, one for practice exercises
- For type "video", phrase the searchQuery for YouTube
- For type "article" or "doc", phrase for Google
- Return ONLY valid JSON array, no extra text, no markdown fences`

function TypeBadge({ type }) {
  const map = {
    video:   { label: '▶ Video',   bg: '#FAECE7', color: '#712B13' },
    article: { label: '✦ Article', bg: '#EEEDFE', color: '#3C3489' },
    doc:     { label: '⊞ Docs',    bg: '#E1F5EE', color: '#085041' },
  }
  const style = map[type] || map.article
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '3px 10px',
      borderRadius: 6, background: style.bg, color: style.color
    }}>
      {style.label}
    </span>
  )
}

function ResourceCard({ resource, index }) {
  const hasLink = resource.url && resource.url !== '#'
  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 10,
      padding: '14px 16px', background: '#fafafa',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: '#7F77DD', color: '#fff',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {index + 1}
        </span>
        <TypeBadge type={resource.type} />
      </div>

      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.4 }}>
        {resource.title || resource.searchQuery}
      </p>

      <p style={{ fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 1.6 }}>
        {resource.why}
      </p>

      {hasLink ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13, color: '#7F77DD', textDecoration: 'none',
            fontWeight: 600, wordBreak: 'break-all'
          }}
        >
          Open resource ↗
        </a>
      ) : (
        <span style={{ fontSize: 13, color: '#bbb' }}>No link found</span>
      )}
    </div>
  )
}

export default function ResourceCuratorNode({ id, data }) {
  const { nodeOutputs, setOutput, setStatus, nodeStatus, activeTopic } = useWorkflowStore()

  const existingOutput = nodeOutputs[id]
  const [topic, setTopic] = useState(existingOutput?.topic || activeTopic || data?.topic || '')
  const [resources, setResources] = useState(existingOutput?.resources || [])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(existingOutput?.reviewed || false)
  const [collapsed, setCollapsed] = useState(false)

  const status = nodeStatus[id] || 'pending'

  // Sync topic when teacher edits StartNode
  useEffect(() => {
    if (activeTopic && !done) setTopic(activeTopic)
  }, [activeTopic, done])

  // Re-sync local state when this node's output is reset externally (loop-back)
  useEffect(() => {
    const out = nodeOutputs[id]
    if (out) {
      setDone(out.reviewed ?? false)
      setResources(out.resources ?? [])
      if (out.topic) setTopic(out.topic)
    }
  }, [nodeOutputs[id]])

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setResources([])
    setStatus(id, 'running')

    try {
      setLoadingStep('Thinking of the best resources...')
      const queries = await callGeminiJSON(SYSTEM_PROMPT, `Topic: ${topic}`)

      setLoadingStep('Searching the web for real links...')
      const results = await Promise.all(
        queries.map(async (q) => {
          try {
            const searchResults = await searchWeb(q.searchQuery, 1)
            const best = q.type === 'video'
              ? (searchResults.videos[0] || searchResults.organic[0])
              : (searchResults.organic[0] || searchResults.videos[0])
            return { ...q, title: best?.title || q.searchQuery, url: best?.url || '#' }
          } catch {
            return { ...q, title: q.searchQuery, url: '#' }
          }
        })
      )

      setResources(results)
      setOutput(id, { topic, resources: results })
      setStatus(id, 'done')
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to fetch resources.')
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

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${status === 'done' ? '#5DCAA5' : '#AFA9EC'}`,
      borderRadius: 14,
      padding: 18,
      width: 380,
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
    }}>
      <Handle type="target" position={Position.Top} />

      <NodeHeader
        badge="AI NODE"
        badgeColor={{ bg: '#EEEDFE', color: '#3C3489' }}
        title="Resource Curator"
        status={status}
        statusColors={statusColors[status]}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {!collapsed && (
        <>
          <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Topic
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="e.g. React Hooks, Photosynthesis..."
            disabled={done}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid #ddd', fontSize: 14, marginBottom: 12,
              boxSizing: 'border-box', background: done ? '#f9f9f9' : '#fff',
              color: done ? '#888' : '#1a1a1a',
            }}
          />

          {!done && (
            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                border: 'none', cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
                background: loading || !topic.trim() ? '#ccc' : '#7F77DD',
                color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 14,
              }}
            >
              {loading ? (loadingStep || 'Working...') : 'Find best resources'}
            </button>
          )}

          {error && (
            <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
              ⚠ {error}
            </p>
          )}

          {resources.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>
                {resources.length} resources found for "{topic}"
              </p>
              <ScrollArea maxHeight={320}>
                {resources.map((r, i) => (
                  <ResourceCard key={i} resource={r} index={i} />
                ))}
              </ScrollArea>
            </>
          )}

          {resources.length > 0 && !done && (
            <button
              onClick={markDone}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10,
                border: '2px solid #5DCAA5', background: '#fff',
                color: '#1D9E75', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Mark as reviewed → next
            </button>
          )}

          {done && (
            <div style={{
              background: '#E1F5EE', borderRadius: 10, padding: '12px 14px',
              fontSize: 13, color: '#085041', fontWeight: 600, textAlign: 'center'
            }}>
              ✓ Reviewed — workflow can advance
            </div>
          )}
        </>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}