// src/store/workflowStore.js
import { create } from 'zustand'

export const useWorkflowStore = create((set, get) => ({

  // ─── Canvas state ────────────────────────────────────────────────
  // The nodes and edges on the React Flow canvas
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // ─── Node execution state ─────────────────────────────────────────
  // nodeOutputs stores what each node produced
  // Key = node ID, Value = whatever the node's AI returned
  // Example: { 'node_1': { topic: 'React Hooks', resources: [...] } }
  nodeOutputs: {},
  setOutput: (nodeId, output) =>
    set(s => ({
      nodeOutputs: { ...s.nodeOutputs, [nodeId]: output }
    })),
  getOutput: (nodeId) => get().nodeOutputs[nodeId],

  // nodeStatus tracks where each node is in its lifecycle
  // Values: 'pending' | 'running' | 'done' | 'failed'
  nodeStatus: {},
  setStatus: (nodeId, status) =>
    set(s => ({
      nodeStatus: { ...s.nodeStatus, [nodeId]: status }
    })),
  getStatus: (nodeId) => get().nodeStatus[nodeId] || 'pending',

  // ─── Student progress ─────────────────────────────────────────────
  // Scores from quiz and assignment nodes
  // Example: { 'quizNode_1': 85, 'assignmentNode_1': 72 }
  scores: {},
  setScore: (nodeId, score) =>
    set(s => ({
      scores: { ...s.scores, [nodeId]: score }
    })),

  // List of node IDs the student has completed
  completedNodes: [],
  markComplete: (nodeId) =>
    set(s => ({
      completedNodes: [...new Set([...s.completedNodes, nodeId])]
    })),
  isComplete: (nodeId) => get().completedNodes.includes(nodeId),

  // Weak topics detected by WeakSpotDetectorNode
  // Example: [{ subtopic: 'useEffect deps', confidence: 80, recommendation: '...' }]
  weakTopics: [],
  setWeakTopics: (topics) => set({ weakTopics: topics }),
  addWeakTopics: (topics) =>
    set(s => ({ weakTopics: [...s.weakTopics, ...topics] })),

  // ─── Teacher escalation queue ─────────────────────────────────────
  // Submissions AI wasn't confident about — teacher must review these
  // Example: [{ id, studentName, submission, aiFeedback, confidence, nodeId }]
  escalationQueue: [],
  addEscalation: (item) =>
    set(s => ({
      escalationQueue: [...s.escalationQueue, { ...item, id: Date.now() }]
    })),
  resolveEscalation: (id) =>
    set(s => ({
      escalationQueue: s.escalationQueue.filter(e => e.id !== id)
    })),

  // ─── Active workflow topic ────────────────────────────────────────
  // Set by StartNode — flows through entire workflow
  activeTopic: '',
  setActiveTopic: (topic) => set({ activeTopic: topic }),

  // ─── Reset (clear everything for a new run) ───────────────────────
  resetWorkflow: () => set({
    nodeOutputs: {},
    nodeStatus: {},
    scores: {},
    completedNodes: [],
    weakTopics: [],
    activeTopic: '',
  }),

}))