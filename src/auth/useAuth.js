// src/auth/useAuth.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      try {
        // Get current user from Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!isMounted) return

        if (!authUser) {
          setLoading(false)
          return
        }

        setUser(authUser)

        // Get user profile with role from users table
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single()

        if (isMounted) {
          if (error) {
            console.error('Error fetching user role:', error)
            setRole(null)
          } else {
            setRole(data?.role || null)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth error:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          // User just logged in
          setUser(session.user)

          // Fetch their role
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          setRole(data?.role || null)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          // User logged out
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  return { user, role, loading, logout }
}