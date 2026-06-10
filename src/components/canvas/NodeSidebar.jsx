const NODE_TYPES = [
  { type: 'startNode',           label: 'Start',              color: '#888' },
  { type: 'resourceCurator',    label: 'Resource Curator',  color: '#7F77DD' },
  { type: 'flashcardGenerator', label: 'Flashcard Generator',color: '#7F77DD' },
  { type: 'quizGenerator',      label: 'Quiz Generator',     color: '#1D9E75' },
  { type: 'assignmentReviewer', label: 'Assignment Reviewer',color: '#EF9F27' },
  { type: 'weakSpotDetector',   label: 'Weak Spot Detector', color: '#EF9F27' },
  { type: 'conditionNode',      label: 'Condition / Branch', color: '#E24B4A' },
  { type: 'textInput',          label: 'Text Input',         color: '#888' },
  { type: 'endNode',            label: 'End',               color: '#888' },
]

export default function NodeSidebar() {
  function onDragStart(e, nodeType) {
    e.dataTransfer.setData('application/reactflow', nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div style={{
      width: 200, padding: 16, borderRight: '1px solid #eee',
      background: '#fff', display: 'flex', flexDirection: 'column', gap: 8,
      overflowY: 'auto'
    }}>
      <p style={{ fontSize:11, fontWeight:500, color:'#888',
        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
        Drag nodes
      </p>
      {NODE_TYPES.map(n => (
        <div
          key={n.type}
          draggable
          onDragStart={(e) => onDragStart(e, n.type)}
          style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'grab',
            border: `1.5px solid ${n.color}20`,
            background: `${n.color}12`,
            fontSize: 12, fontWeight: 500, color: n.color,
            userSelect: 'none',
          }}>
          {n.label}
        </div>
      ))}
    </div>
  )
}