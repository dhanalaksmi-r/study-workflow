// src/components/teacher/WorkflowCanvas.jsx
import { useCallback, useState } from 'react'
import { 
  ReactFlow, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Node types
const nodeTypes = {
  start: { label: '🎯 Start', color: '#7F77DD' },
  resources: { label: '📚 Resources', color: '#7F77DD' },
  flashcards: { label: '🃏 Flashcards', color: '#7F77DD' },
  quiz: { label: '📝 Quiz', color: '#7F77DD' },
  condition: { label: '◆ Condition', color: '#EF9F27' },
  weakspot: { label: '🔍 Weak Spot', color: '#EF9F27' },
  end: { label: '✓ End', color: '#1D9E75' }
}

// Custom node component
function CanvasNode({ data, isConnectable }) {
  return (
    <div style={{
      background: data.color,
      color: '#fff',
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      textAlign: 'center',
      cursor: 'pointer',
      minWidth: 100,
      border: '2px solid transparent'
    }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      {data.label}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  )
}

export default function WorkflowCanvas({ workflowId, initialNodes = [], onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.length > 0 ? initialNodes : [])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [saving, setSaving] = useState(false)

  // Handle connections
  const onConnect = useCallback(
    (connection) => setEdges(eds => addEdge(connection, eds)),
    [setEdges]
  )

  // Drag from sidebar
  const onDragOver = useCallback(event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    event => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/nodeType')
      if (!nodeType || !nodeTypes[nodeType]) return

      // Calculate position
      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left - 50,
        y: event.clientY - reactFlowBounds.top - 25
      }

      // Create new node
      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        data: { 
          label: nodeTypes[nodeType].label,
          color: nodeTypes[nodeType].color,
          type: nodeType,
          config: {} // For node-specific config (e.g., pass threshold)
        },
        position,
        type: 'default'
      }

      setNodes(nds => [...nds, newNode])
    },
    [setNodes]
  )

  // Delete selected node
  function deleteNode() {
    if (!selectedNode) return
    setNodes(nds => nds.filter(n => n.id !== selectedNode))
    setEdges(eds => eds.filter(e => e.source !== selectedNode && e.target !== selectedNode))
    setSelectedNode(null)
  }

  // Save workflow
  async function handleSave() {
    setSaving(true)
    try {
      const nodeStructure = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.data.type,
          position: n.position,
          config: n.data.config
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target
        }))
      }

      console.log('Saving workflow:', nodeStructure)
      onSave?.(nodeStructure)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <div style={{
        width: 200,
        background: '#fff',
        borderRight: '1px solid #eee',
        padding: 16,
        overflowY: 'auto'
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 12 }}>
          Drag nodes to canvas
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(nodeTypes).map(([type, config]) => (
            <div
              key={type}
              draggable
              onDragStart={e => e.dataTransfer.setData('application/nodeType', type)}
              style={{
                background: config.color,
                color: '#fff',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'grab',
                textAlign: 'center',
                userSelect: 'none'
              }}
            >
              {config.label}
            </div>
          ))}
        </div>

        <hr style={{ margin: '16px 0', borderColor: '#eee' }} />

        {/* Controls */}
        <button
          onClick={deleteNode}
          disabled={!selectedNode}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: selectedNode ? '#E24B4A' : '#eee',
            color: selectedNode ? '#fff' : '#bbb',
            fontSize: 12,
            fontWeight: 600,
            cursor: selectedNode ? 'pointer' : 'not-allowed',
            marginBottom: 8
          }}
        >
          Delete Node
        </button>

        <button
          onClick={handleSave}
          disabled={saving || nodes.length === 0}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: nodes.length > 0 ? '#1D9E75' : '#eee',
            color: nodes.length > 0 ? '#fff' : '#bbb',
            fontSize: 12,
            fontWeight: 600,
            cursor: nodes.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          {saving ? 'Saving...' : '💾 Save Workflow'}
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }} onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes.map(n => ({
            ...n,
            data: { ...n.data },
            selected: n.id === selectedNode
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => setSelectedNode(node.id)}
          nodeTypes={{'default': CanvasNode}}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Info panel */}
      {selectedNode && (
        <div style={{
          width: 200,
          background: '#fff',
          borderLeft: '1px solid #eee',
          padding: 16,
          fontSize: 12
        }}>
          <p style={{ fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
            Node Config
          </p>
          <p style={{ color: '#888' }}>
            {nodes.find(n => n.id === selectedNode)?.data.label}
          </p>
          <p style={{ color: '#bbb', fontSize: 11, marginTop: 8 }}>
            More options coming soon
          </p>
        </div>
      )}
    </div>
  )
}