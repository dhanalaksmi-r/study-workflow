// src/auth/useAuth.js — Simplified version
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    async function initAuth() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!isMounted) return

        if (userError || !user) {
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        setUser(user)

        // Try to fetch role, but don't block if it fails
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (!isMounted) return

          if (!error && data) {
            setRole(data.role)
          } else {
            setRole(null)
          }
        } catch (err) {
          console.log('Could not fetch role:', err.message)
          setRole(null)
        }

        setLoading(false)
      } catch (err) {
        if (isMounted) {
          console.error('Auth init error:', err)
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [mounted])

  async function signup(email, password, name, roleType) {
    const { data: { user }, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signupError) throw signupError
    if (!user) throw new Error('Signup failed')

    // Insert profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{ 
        id: user.id, 
        email, 
        name, 
        role: roleType 
      }])

    if (profileError) throw profileError

    setUser(user)
    setRole(roleType)
    return user
  }

  async function login(email, password) {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!user) throw new Error('Login failed')

    setUser(user)
    
    // Fetch role
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    setRole(data?.role || null)
    return user
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  return { user, role, loading, signup, login, logout }
}