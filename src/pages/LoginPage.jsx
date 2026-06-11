// src/pages/LoginPage.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, role } = useAuth()

  // Already logged in → redirect to their page
  useEffect(() => {
    if (role) {
      navigate(`/${role}`, { replace: true })
    }
  }, [role, navigate])

  function handleLogin(selectedRole) {
    login(selectedRole)
    navigate(`/${selectedRole}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ecfdf5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>

        {/* Logo / Title */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          📚
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
          Study Workflow Builder
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
          AI-powered learning workflows
        </p>

        {/* Login buttons */}
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Login as
        </p>

        <button
          onClick={() => handleLogin('teacher')}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: '#7F77DD', color: '#fff',
            fontSize: 15, fontWeight: 600, marginBottom: 12,
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.target.style.opacity = '0.9'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          🧑‍🏫 Login as Teacher
        </button>

        <button
          onClick={() => handleLogin('student')}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: '#1D9E75', color: '#fff',
            fontSize: 15, fontWeight: 600,
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.target.style.opacity = '0.9'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          🎓 Login as Student
        </button>

        
      </div>
    </div>
  )
}