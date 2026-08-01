// src/pages/SignupPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    // Validation
    if (!email || !password || !name || !confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create auth account
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signupError) throw signupError

      console.log('Auth account created:', authData.user.id)

      // Step 2: Create user profile in users table
      const { error: profileError } = await supabase.from('users').insert([{
        id: authData.user.id,
        email,
        name,
        role
      }])

      if (profileError) throw profileError

      setMessage('✅ Account created! Redirecting to login...')
      
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      console.error('Signup error:', err)
      setError(err.message || 'Signup failed')
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
          Create Account
        </h1>
        
        <p style={{
          fontSize: 14,
          color: '#888',
          textAlign: 'center',
          marginBottom: 24
        }}>
          Join our learning platform
        </p>

        {message && (
          <div style={{
            background: '#E1F5EE',
            border: '1px solid #5DCAA5',
            color: '#085041',
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#FAECE7',
            border: '1px solid #F0997B',
            color: '#712B13',
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{
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
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., John Doe"
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
              Role
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
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
              placeholder="At least 6 characters"
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
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#888',
          marginTop: 16
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}