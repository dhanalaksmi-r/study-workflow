// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import StudentPage from './pages/StudentPage'
import TeacherPage from './pages/TeacherPage'
import ProtectedRoute from './auth/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public route — login page */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected — only teacher role can access */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherPage />
            </ProtectedRoute>
          }
        />

        {/* Protected — only student role can access */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentPage />
            </ProtectedRoute>
          }
        />

        {/* Anything else → login */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}