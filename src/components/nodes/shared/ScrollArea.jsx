// src/components/nodes/shared/ScrollArea.jsx
//
// Wraps long content (resource lists, flashcards, quiz questions...)
// in a fixed-height scrollable box so the node itself doesn't grow
// endlessly and push other nodes around the canvas.

export default function ScrollArea({ children, maxHeight = 320 }) {
  return (
    <div
      className="node-scroll-area"
      style={{
        maxHeight,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingRight: 6,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}