import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import NodeSidebar from './NodeSidebar'
import StartNode from '../nodes/StartNode'
import EndNode from '../nodes/EndNode'
import ResourceCuratorNode from '../nodes/ResourceCuratorNode'
import FlashcardGeneratorNode from '../nodes/FlashcardGeneratorNode'
import QuizGeneratorNode from '../nodes/QuizGeneratorNode'
import AssignmentReviewerNode from '../nodes/AssignmentReviewerNode'
import WeakSpotDetectorNode from '../nodes/WeakSpotDetectorNode'
import ConditionNode from '../nodes/ConditionNode'
import TextInputNode from '../nodes/TextInputNode'

// Register all node types here
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

// Demo nodes pre-loaded so canvas is not empty
const initialNodes = [
  { id: '1', type: 'startNode',        position: { x: 250, y: 50 },  data: { topic: 'React Hooks' } },
  { id: '2', type: 'resourceCurator',   position: { x: 250, y: 180 }, data: {} },
  { id: '3', type: 'flashcardGenerator',position: { x: 250, y: 320 }, data: {} },
  { id: '4', type: 'quizGenerator',     position: { x: 250, y: 460 }, data: {} },
  { id: '5', type: 'endNode',           position: { x: 250, y: 600 }, data: {} },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
]

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge(params, eds)), [setEdges]
  )

  // Drop handler — adds new node where user drops
  const onDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type || !reactFlowInstance) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: e.clientX, y: e.clientY
    })
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: { label: type }
    }
    setNodes(nds => [...nds, newNode])
  }, [reactFlowInstance, setNodes])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div style={{ display:'flex', height:'100vh', width:'100%' }}>
      <NodeSidebar />
      <div ref={reactFlowWrapper} style={{ flex:1 }}>
        <ReactFlow
          nodes={nodes} edges={edges}
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