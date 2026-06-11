export function useAuth() {
  const role = localStorage.getItem('role')
  const isLoggedIn = !!role

  function login(role) {
    localStorage.setItem('role', role)
  }

  function logout() {
    localStorage.removeItem('role')
    window.location.href = '/'
  }

  return { role, isLoggedIn, login, logout }
}