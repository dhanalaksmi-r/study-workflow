import {BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';

export default function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginPage/>}/>
            <Route path="/student" element={<StudentPage/>}/>
            <Route path="/teacher" element={<TeacherPage/>}/>
            <Route path="*" element={<Navigate to="/" />} />
            </Routes>
    </BrowserRouter>
  );
}