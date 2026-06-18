// src/store/workflowStore.js
// v2 — adds assignedWorkflows, separate student/teacher state
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWorkflowStore = create(
  persist(
    (set, get) => ({

      // ─── Canvas state (teacher only) ──────────────────────────────
      nodes: [],
      edges: [],
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      // ─── Node execution state ─────────────────────────────────────
      nodeOutputs: {},
      setOutput: (nodeId, output) =>
        set(s => ({ nodeOutputs: { ...s.nodeOutputs, [nodeId]: output } })),
      getOutput: (nodeId) => get().nodeOutputs[nodeId],

      resetNodeOutput: (nodeId, partial) =>
        set(s => ({
          nodeOutputs: {
            ...s.nodeOutputs,
            [nodeId]: { ...s.nodeOutputs[nodeId], ...partial }
          },
          nodeStatus: { ...s.nodeStatus, [nodeId]: 'pending' }
        })),

      nodeStatus: {},
      setStatus: (nodeId, status) =>
        set(s => ({ nodeStatus: { ...s.nodeStatus, [nodeId]: status } })),
      getStatus: (nodeId) => get().nodeStatus[nodeId] || 'pending',

      // ─── Scores ───────────────────────────────────────────────────
      scores: {},
      lastScore: null,
      setScore: (nodeId, score) =>
        set(s => ({
          scores: { ...s.scores, [nodeId]: score },
          lastScore: score,
        })),

      // ─── Student progress ─────────────────────────────────────────
      completedNodes: [],
      markComplete: (nodeId) =>
        set(s => ({
          completedNodes: [...new Set([...s.completedNodes, nodeId])]
        })),
      isComplete: (nodeId) => get().completedNodes.includes(nodeId),

      weakTopics: [],
      setWeakTopics: (topics) => set({ weakTopics: topics }),
      addWeakTopics: (topics) =>
        set(s => ({ weakTopics: [...s.weakTopics, ...topics] })),

      retryCount: 0,
      incrementRetry: () => set(s => ({ retryCount: s.retryCount + 1 })),

      // ─── Teacher escalation queue ─────────────────────────────────
      escalationQueue: [],
      addEscalation: (item) =>
        set(s => ({
          escalationQueue: [
            ...s.escalationQueue,
            { ...item, id: Date.now() }
          ]
        })),
      resolveEscalation: (id) =>
        set(s => ({
          escalationQueue: s.escalationQueue.filter(e => e.id !== id)
        })),

      // ─── Active workflow ──────────────────────────────────────────
      activeTopic: '',
      setActiveTopic: (topic) => set({ activeTopic: topic }),

      // ─── ASSIGNED WORKFLOWS (teacher assigns, student sees) ───────
      // Teacher publishes a workflow → it appears in student's list
      // Each workflow: { id, title, description, topic, nodeIds, publishedAt }
      assignedWorkflows: [],

      assignWorkflow: (workflow) =>
        set(s => ({
          assignedWorkflows: [
            // replace if same id, else add
            ...s.assignedWorkflows.filter(w => w.id !== workflow.id),
            { ...workflow, assignedAt: new Date().toLocaleString() }
          ]
        })),

      removeWorkflow: (id) =>
        set(s => ({
          assignedWorkflows: s.assignedWorkflows.filter(w => w.id !== id)
        })),

      // ─── Student workflow completion tracking ─────────────────────
      // { workflowId: 'complete' | 'in-progress' | 'not-started' }
      workflowProgress: {},
      setWorkflowProgress: (workflowId, status) =>
        set(s => ({
          workflowProgress: { ...s.workflowProgress, [workflowId]: status }
        })),

      // ─── Reset student progress (fresh start) ────────────────────
      resetStudentProgress: () => set({
        nodeOutputs: {},
        nodeStatus: {},
        scores: {},
        lastScore: null,
        completedNodes: [],
        weakTopics: [],
        activeTopic: '',
        retryCount: 0,
        workflowProgress: {},
      }),

      // ─── Reset everything ─────────────────────────────────────────
      resetWorkflow: () => set({
        nodeOutputs: {},
        nodeStatus: {},
        scores: {},
        lastScore: null,
        completedNodes: [],
        weakTopics: [],
        activeTopic: '',
        retryCount: 0,
      }),

    }),
    { name: 'workflow-store' }
  )
)