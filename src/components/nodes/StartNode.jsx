import { Handle, Position } from '@xyflow/react'

export default function StartNode({ data }) {
  return (
    <div style={{
      background:'#fff', border:'1.5px solid #888',
      borderRadius:10, padding:12, minWidth:160,
      fontFamily:'sans-serif', fontSize:13
    }}>
      <p style={{ fontWeight:600, marginBottom:6, color:'#444' }}>▶ Start</p>
      <p style={{ fontSize:12, color:'#888' }}>Topic: {data.topic || 'Not set'}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}