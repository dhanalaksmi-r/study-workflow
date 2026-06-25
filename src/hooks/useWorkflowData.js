// src/hooks/useWorkflowData.js
// Replaces Zustand — queries Supabase for workflow data
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Get assigned workflows for current student
export function useAssignedWorkflows(studentId) {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return

    async function fetch() {
      const { data, error } = await supabase
        .from('assigned_workflows')
        .select('workflow_id, workflows(id, title, topic, description, assigned_at)')
        .in('workflow_id', 
          (await supabase
            .from('workflows')
            .select('id')
            .join('assigned_workflows', 'workflows.id', '=', 'assigned_workflows.workflow_id')
            .limit(100)
          ).data?.map(w => w.id) || []
        )

      if (error) console.error(error)
      else setWorkflows(data || [])
      setLoading(false)
    }

    fetch()
  }, [studentId])

  return { workflows, loading }
}

// Get a specific workflow's run (student's current progress)
export function useWorkflowRun(workflowId, studentId) {
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workflowId || !studentId) return

    async function fetch() {
      const { data, error } = await supabase
        .from('workflow_runs')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      // .single() throws if no row, that's ok — first run
      if (error?.code === 'PGRST116') {
        setRun(null)
      } else if (error) {
        console.error(error)
      } else {
        setRun(data)
      }
      setLoading(false)
    }

    fetch()
  }, [workflowId, studentId])

  return { run, loading }
}

// Update a workflow run (student progressing through nodes)
export async function updateWorkflowRun(runId, updates) {
  const { data, error } = await supabase
    .from('workflow_runs')
    .update(updates)
    .eq('id', runId)
    .select()

  if (error) throw error
  return data
}

// Create a new workflow run
export async function createWorkflowRun(workflowId, studentId) {
  const { data, error } = await supabase
    .from('workflow_runs')
    .insert([{
      workflow_id: workflowId,
      student_id: studentId,
      status: 'in-progress',
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Get teacher's class dashboard data
export function useTeacherDashboard(teacherId) {
  const [classData, setClassData] = useState({
    workflows: [],
    studentProgress: [],
    escalations: [],
    loading: true,
  })

  useEffect(() => {
    if (!teacherId) return

    async function fetch() {
      // Get teacher's workflows
      const { data: workflows } = await supabase
        .from('workflows')
        .select('*')
        .eq('teacher_id', teacherId)

      // Get all runs for this teacher's workflows
      const workflowIds = workflows?.map(w => w.id) || []
      const { data: runs } = await supabase
        .from('workflow_runs')
        .select('*, students:student_id(email, name)')
        .in('workflow_id', workflowIds)

      // Get escalations
      const { data: escalations } = await supabase
        .from('escalations')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('status', 'pending')

      setClassData({
        workflows: workflows || [],
        studentProgress: runs || [],
        escalations: escalations || [],
        loading: false,
      })
    }

    fetch()
  }, [teacherId])

  return classData
}

// Get a specific workflow (for editing)
export function useWorkflow(workflowId) {
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workflowId) return

    async function fetch() {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (error) console.error(error)
      else setWorkflow(data)
      setLoading(false)
    }

    fetch()
  }, [workflowId])

  return { workflow, loading }
}

// Save/create workflow
export async function saveWorkflow(teacherId, workflow) {
  if (workflow.id) {
    // Update existing
    const { data, error } = await supabase
      .from('workflows')
      .update(workflow)
      .eq('id', workflow.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('workflows')
      .insert([{ ...workflow, teacher_id: teacherId }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Assign workflow to class
export async function assignWorkflowToClass(workflowId, teacherId, className) {
  const { data, error } = await supabase
    .from('assigned_workflows')
    .insert([{ workflow_id: workflowId, teacher_id: teacherId, class_name: className }])
    .select()

  if (error) throw error
  return data
}