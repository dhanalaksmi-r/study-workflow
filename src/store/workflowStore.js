// src/store/workflowStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useWorkflowStore = create(persist((set, get) => ({

  // ─── Canvas state ────────────────────────────────────────────────
  // Nodes and edges now live in the store (not local useNodesState/useEdgesState)
  // so that nodes like ConditionNode can update edge styles directly.
  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // ─── Node execution state ─────────────────────────────────────────
  nodeOutputs: {},
  setOutput: (nodeId, output) =>
    set(s => ({ nodeOutputs: { ...s.nodeOutputs, [nodeId]: output } })),
  getOutput: (nodeId) => get().nodeOutputs[nodeId],

  // Merge-patch an existing output and reset its status to 'pending'
  // Used by WeakSpotDetectorNode to "loop back" earlier nodes
  resetNodeOutput: (nodeId, partial) =>
    set(s => ({
      nodeOutputs: { ...s.nodeOutputs, [nodeId]: { ...s.nodeOutputs[nodeId], ...partial } },
      nodeStatus: { ...s.nodeStatus, [nodeId]: 'pending' }
    })),

  nodeStatus: {},
  setStatus: (nodeId, status) =>
    set(s => ({ nodeStatus: { ...s.nodeStatus, [nodeId]: status } })),
  getStatus: (nodeId) => get().nodeStatus[nodeId] || 'pending',

  // ─── Scores ────────────────────────────────────────────────────────
  scores: {},
  lastScore: null, // ConditionNode reads this — the most recent quiz score
  setScore: (nodeId, score) =>
    set(s => ({
      scores: { ...s.scores, [nodeId]: score },
      lastScore: score,
    })),

  // ─── Student progress ─────────────────────────────────────────────
  completedNodes: [],
  markComplete: (nodeId) =>
    set(s => ({ completedNodes: [...new Set([...s.completedNodes, nodeId])] })),
  isComplete: (nodeId) => get().completedNodes.includes(nodeId),

  weakTopics: [],
  setWeakTopics: (topics) => set({ weakTopics: topics }),
  addWeakTopics: (topics) =>
    set(s => ({ weakTopics: [...s.weakTopics, ...topics] })),

  // How many times the student has looped back (for teacher alerts later)
  retryCount: 0,
  incrementRetry: () => set(s => ({ retryCount: s.retryCount + 1 })),

  // ─── Teacher escalation queue ─────────────────────────────────────
  escalationQueue: [],
  addEscalation: (item) =>
    set(s => ({ escalationQueue: [...s.escalationQueue, { ...item, id: Date.now() }] })),
  resolveEscalation: (id) =>
    set(s => ({ escalationQueue: s.escalationQueue.filter(e => e.id !== id) })),

  // ─── Active workflow topic ────────────────────────────────────────
  activeTopic: '',
  setActiveTopic: (topic) => set({ activeTopic: topic }),

  // ─── Reset everything (new workflow run) ──────────────────────────
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

})))