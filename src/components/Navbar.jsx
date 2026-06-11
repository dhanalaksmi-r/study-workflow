import { useAuth } from '../auth/useAuth'

export default function Navbar({ title }) {
  const { role, logout } = useAuth()

  const roleColors = {
    teacher: { bg: '#7F77DD', label: 'Teacher' },
    student: { bg: '#1D9E75', label: 'Student' },
  }
  const rc = roleColors[role] || roleColors.student

  return (
    <div style={{
      height: 56,
      background: '#fff',
      borderBottom: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      fontFamily: 'sans-serif',
      flexShrink: 0,
      zIndex: 10,
    }}>

      {/* Left — app name + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>📚</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
          Study Workflow
        </span>
        {title && (
          <>
            <span style={{ color: '#ddd' }}>|</span>
            <span style={{ fontSize: 14, color: '#666' }}>{title}</span>
          </>
        )}
      </div>

      {/* Right — role badge + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 12, fontWeight: 500, padding: '4px 12px',
          borderRadius: 20, background: rc.bg + '18', color: rc.bg,
          border: `1px solid ${rc.bg}30`,
        }}>
          {rc.label}
        </span>
        <button
          onClick={logout}
          style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid #eee', background: '#fafafa',
            fontSize: 12, color: '#666', fontWeight: 500,
          }}
          onMouseOver={e => e.target.style.background = '#f0f0f0'}
          onMouseOut={e => e.target.style.background = '#fafafa'}
        >
          Logout
        </button>
      </div>
    </div>
  )
}