// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && role) {
      console.log('Redirecting as:', role)
      if (role === 'teacher') {
        navigate('/teacher', { replace: true })
      } else if (role === 'student') {
        navigate('/student', { replace: true })
      }
    }
  }, [user, role])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      console.log('✓ Login successful')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: 400,
        width: '100%'
      }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          color: '#1a1a1a',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Welcome Back
        </h1>
        
        <p style={{
          fontSize: 14,
          color: '#888',
          textAlign: 'center',
          marginBottom: 24
        }}>
          Sign in to your account
        </p>

        {error && (
          <div style={{
            background: '#FAECE7',
            border: '1px solid #F0997B',
            color: '#712B13',
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              color: '#888'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
              color: '#888'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

        <p style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#888'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: '#1e40af;',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}