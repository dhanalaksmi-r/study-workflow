// src/pages/StudentPage.jsx
import Navbar from '../components/Navbar'

export default function StudentPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <Navbar title="My Workflows" />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 12,
        color: '#888',
      }}>
        <span style={{ fontSize: 48 }}>🎓</span>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#444' }}>Student Dashboard</p>
        <p style={{ fontSize: 13 }}>Your assigned workflows will appear here — coming Day 12</p>
      </div>
    </div>
  )
}