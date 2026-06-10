
import { Handle, Position } from '@xyflow/react'

export default function WeakSpotDetectorNode({ data }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #EF9F27',
      borderRadius: 10, padding: 12, minWidth: 160,
      fontFamily: 'sans-serif', fontSize: 13
    }}>
      <Handle type="target" position={Position.Top} />   {/* receives input */}

      <p style={{ fontWeight: 600, color: '#EF9F27' }}>Weak Spot Detector</p>
      <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Coming Day 6</p>

      <Handle type="source" position={Position.Bottom} /> {/* sends output */}
    </div>
  )
}