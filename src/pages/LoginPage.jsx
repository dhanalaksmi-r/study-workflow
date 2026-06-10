import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  function loginAs(role) {
    localStorage.setItem('role', role)
    navigate(`/${role}`)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', gap:16, fontFamily:'sans-serif' }}>
      <h1 style={{ fontSize:24, fontWeight:600 }}>Study Workflow Builder</h1>
      <p style={{ color:'#888', marginBottom:8 }}>Login as:</p>
      <button onClick={() => loginAs('teacher')}
        style={{ padding:'12px 32px', fontSize:15, borderRadius:8,
          background:'#7F77DD', color:'#fff', border:'none', cursor:'pointer' }}>
        Login as Teacher
      </button>
      <button onClick={() => loginAs('student')}
        style={{ padding:'12px 32px', fontSize:15, borderRadius:8,
          background:'#1D9E75', color:'#fff', border:'none', cursor:'pointer' }}>
        Login as Student
      </button>
    </div>
  )
}