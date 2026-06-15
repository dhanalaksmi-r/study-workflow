// src/components/canvas/WorkflowCanvas.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import NodeSidebar from './NodeSidebar'
import { useWorkflowStore } from '../../store/workflowStore'

import StartNode from '../nodes/StartNode'
import EndNode from '../nodes/EndNode'
import ResourceCuratorNode from '../nodes/ResourceCuratorNode'
import FlashcardGeneratorNode from '../nodes/FlashcardGeneratorNode'
import QuizGeneratorNode from '../nodes/QuizGeneratorNode'
import AssignmentReviewerNode from '../nodes/AssignmentReviewerNode'
import WeakSpotDetectorNode from '../nodes/WeakSpotDetectorNode'
import ConditionNode from '../nodes/ConditionNode'
import TextInputNode from '../nodes/TextInputNode'

const nodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  resourceCurator: ResourceCuratorNode,
  flashcardGenerator: FlashcardGeneratorNode,
  quizGenerator: QuizGeneratorNode,
  assignmentReviewer: AssignmentReviewerNode,
  weakSpotDetector: WeakSpotDetectorNode,
  conditionNode: ConditionNode,
  textInput: TextInputNode,
}

// ─── Demo workflow layout ───────────────────────────────────────────────────
//
//   Start
//     ↓
//   Resource Curator  ←──────────────────┐
//     ↓                                  │ loop back (dashed)
//   Flashcard Generator                  │
//     ↓                                  │
//   Quiz Generator                       │
//     ↓                                  │
//   Condition Node                       │
//     ├── pass  → End                    │
//     └── retry → Weak Spot Detector ────┘
//
const initialNodes = [
  { id: '1', type: 'startNode',          position: { x: 420, y: 40 },   data: { topic: 'React Hooks' } },
  { id: '2', type: 'resourceCurator',    position: { x: 380, y: 160 },  data: {} },
  { id: '3', type: 'flashcardGenerator', position: { x: 380, y: 360 },  data: {} },
  { id: '4', type: 'quizGenerator',      position: { x: 360, y: 600 },  data: {} },
  { id: '5', type: 'conditionNode',      position: { x: 420, y: 1000 }, data: {} },
  { id: '6', type: 'endNode',            position: { x: 760, y: 1180 }, data: {} },
  { id: '7', type: 'weakSpotDetector',   position: { x: 60,  y: 1180 }, data: {} },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
  // Named source handles — ConditionNode highlights one of these on evaluate
  { id: 'e5-6', source: '5', sourceHandle: 'pass',  target: '6', label: 'Pass ≥70%',
    style: { stroke: '#ddd' }, labelStyle: { fill: '#bbb' } },
  { id: 'e5-7', source: '5', sourceHandle: 'retry', target: '7', label: 'Retry <70%',
    style: { stroke: '#ddd' }, labelStyle: { fill: '#bbb' } },
  // Loop back from Weak Spot Detector to Resource Curator
  { id: 'e7-2', source: '7', target: '2', label: 'Loop back',
    style: { stroke: '#AFA9EC', strokeDasharray: '5 5' }, labelStyle: { fill: '#7F77DD' } },
]

export default function WorkflowCanvas() {
  const storeNodes = useWorkflowStore(s => s.nodes)
  const storeEdges = useWorkflowStore(s => s.edges)
  const setStoreNodes = useWorkflowStore(s => s.setNodes)
  const setStoreEdges = useWorkflowStore(s => s.setEdges)

  // Initialize the store with the demo workflow on first load only
  useEffect(() => {
    if (storeNodes.length === 0) setStoreNodes(initialNodes)
    if (storeEdges.length === 0) setStoreEdges(initialEdges)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const onNodesChange = useCallback((changes) => {
    setStoreNodes(applyNodeChanges(changes, storeNodes))
  }, [storeNodes, setStoreNodes])

  const onEdgesChange = useCallback((changes) => {
    setStoreEdges(applyEdgeChanges(changes, storeEdges))
  }, [storeEdges, setStoreEdges])

  const onConnect = useCallback((params) => {
    setStoreEdges(addEdge(params, storeEdges))
  }, [storeEdges, setStoreEdges])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type || !reactFlowInstance) return
    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const newNode = { id: `node_${Date.now()}`, type, position, data: {} }
    setStoreNodes([...storeNodes, newNode])
  }, [reactFlowInstance, storeNodes, setStoreNodes])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <NodeSidebar />
      <div ref={reactFlowWrapper} style={{ flex: 1 }}>
        <ReactFlow
          nodes={storeNodes}
          edges={storeEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}