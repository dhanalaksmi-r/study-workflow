// src/pages/TeacherPage.jsx
import Navbar from '../components/Navbar'
import WorkflowCanvas from '../components/canvas/WorkflowCanvas'

export default function TeacherPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title="Workflow Builder" />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WorkflowCanvas />
      </div>
    </div>
  )
}