import { create } from 'zustand'

export const useWorkflowStore = create((set) => ({
  // Canvas nodes and edges
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // Each node's output data (passed to next node)
  nodeOutputs: {},
  setOutput: (nodeId, output) =>
    set(s => ({ nodeOutputs: { ...s.nodeOutputs, [nodeId]: output } })),

  // Each node's running status
  nodeStatus: {},
  setStatus: (nodeId, status) =>
    set(s => ({ nodeStatus: { ...s.nodeStatus, [nodeId]: status } })),

  // Student progress
  scores: {},
  completedNodes: [],
  weakTopics: [],
  setScore: (nodeId, score) =>
    set(s => ({ scores: { ...s.scores, [nodeId]: score } })),
  markComplete: (nodeId) =>
    set(s => ({ completedNodes: [...s.completedNodes, nodeId] })),

  // Teacher escalation queue
  escalationQueue: [],
  addEscalation: (item) =>
    set(s => ({ escalationQueue: [...s.escalationQueue, item] })),
  resolveEscalation: (id) =>
    set(s => ({ escalationQueue: s.escalationQueue.filter(e => e.id !== id) })),
}))