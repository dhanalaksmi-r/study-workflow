// src/components/nodes/shared/NodeHeader.jsx
//
// Reusable, clickable header for every node.
// Click anywhere on it to collapse/expand the node body —
// this is what lets nodes shrink to a single row when not in use.

export default function NodeHeader({
  badge,        // e.g. "AI NODE" — small pill on the left
  badgeColor,   // { bg, color }
  title,        // e.g. "Resource Curator"
  status,       // e.g. "done" | "running" | "pending" | "failed" | custom branch label
  statusColors, // { bg, color }
  collapsed,
  onToggleCollapse,
}) {
  return (
    <div
      onClick={onToggleCollapse}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: collapsed ? 0 : 14,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {badge && (
          <span style={{
            background: badgeColor?.bg || '#EEEDFE',
            color: badgeColor?.color || '#3C3489',
            borderRadius: 6, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {badge}
          </span>
        )}
        <span style={{
          fontWeight: 700, fontSize: 16, color: '#1a1a1a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {status && (
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 6,
            background: statusColors?.bg || '#f5f5f5',
            color: statusColors?.color || '#888',
            fontWeight: 600, textTransform: 'uppercase',
          }}>
            {status}
          </span>
        )}
        <span style={{
          fontSize: 14, color: '#aaa', transform: collapsed ? 'rotate(-90deg)' : 'none',
          transition: 'transform 0.15s', display: 'inline-block', width: 14,
        }}>
          ▾
        </span>
      </div>
    </div>
  )
}