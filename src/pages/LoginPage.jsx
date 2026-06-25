// src/pages/LoginPage.jsx — Ultra minimal test version
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

 async function handleLogin(e) {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) throw loginError

    console.log('Logged in user:', data.user.id)

    // Get role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    console.log('Profile:', profile)
    console.log('Profile error:', profileError)

    if (!profile) {
      setError('Role not found. User profile missing.')
      setLoading(false)
      return
    }

    console.log('Redirecting as:', profile.role)
    
    setTimeout(() => {
      if (profile.role === 'teacher') {
        console.log('Going to /teacher')
        navigate('/teacher')
      } else if (profile.role === 'student') {
        console.log('Going to /student')
        navigate('/student')
      } else {
        console.log('Unknown role:', profile.role)
        setError('Unknown role: ' + profile.role)
      }
    }, 500)
  } catch (err) {
    setError(err.message)
    console.error('Login error:', err)
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 30, textAlign: 'center' }}>
          📚 Study Workflow
        </h1>

        {error && (
          <div style={{
            background: '#FAECE7',
            border: '1px solid #F0997B',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
            color: '#712B13',
          }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teacher@test.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password123"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}