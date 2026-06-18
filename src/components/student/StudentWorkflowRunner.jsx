// src/components/student/StudentWorkflowRunner.jsx
import { useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import ResourceCuratorNode from '../nodes/ResourceCuratorNode'
import FlashcardGeneratorNode from '../nodes/FlashcardGeneratorNode'
import QuizGeneratorNode from '../nodes/QuizGeneratorNode'
import WeakSpotDetectorNode from '../nodes/WeakSpotDetectorNode'
import TextInputNode from '../nodes/TextInputNode'
import AssignmentReviewerNode from '../nodes/AssignmentReviewerNode'
import ConditionNode from '../nodes/ConditionNode'

const WORKFLOW_STEPS = [
  { id: '2', type: 'resourceCurator',    title: 'Find Resources',    icon: '📚', desc: 'AI curates the best learning resources for your topic.' },
  { id: '3', type: 'flashcardGenerator', title: 'Study Flashcards',  icon: '🃏', desc: 'Review key concepts before the quiz.' },
  { id: '4', type: 'quizGenerator',      title: 'Take the Quiz',     icon: '📝', desc: 'Test your understanding. Score ≥70% to advance.' },
  { id: '5', type: 'conditionNode',      title: 'Check Your Score',  icon: '◆', desc: 'AI evaluates your score and routes you forward.' },
  { id: '7', type: 'weakSpotDetector',   title: 'Analyse Gaps',      icon: '🔍', desc: 'AI identifies exactly what to revisit.' },
]

const NODE_COMPONENTS = {
  resourceCurator:    ResourceCuratorNode,
  flashcardGenerator: FlashcardGeneratorNode,
  quizGenerator:      QuizGeneratorNode,
  conditionNode:      ConditionNode,
  weakSpotDetector:   WeakSpotDetectorNode,
  textInput:          TextInputNode,
  assignmentReviewer: AssignmentReviewerNode,
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, currentIndex, nodeStatus }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '16px 28px', background: '#fff',
      borderBottom: '1px solid #eee', overflowX: 'auto', flexShrink: 0,
    }}>
      {steps.map((step, i) => {
        const status = nodeStatus[step.id] || 'pending'
        const isActive = i === currentIndex
        const isDone = status === 'done' || status === 'escalated'

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 72 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isDone ? 16 : 14, fontWeight: 700,
                background: isDone ? '#1D9E75' : isActive ? '#7F77DD' : '#f0f0f0',
                color: isDone || isActive ? '#fff' : '#bbb',
                border: isActive ? '2px solid #7F77DD' : 'none',
                transition: 'all 0.2s',
              }}>
                {isDone ? '✓' : step.icon}
              </div>
              <span style={{
                fontSize: 10, textAlign: 'center', lineHeight: 1.3,
                color: isDone ? '#1D9E75' : isActive ? '#7F77DD' : '#bbb',
                fontWeight: isActive ? 600 : 400, maxWidth: 64,
              }}>
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 28, height: 2, margin: '0 2px', marginBottom: 18,
                background: isDone ? '#1D9E75' : '#eee',
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Completion screen — rendered INSIDE the runner, not replacing it ─────────
function CompletionScreen({ onBack, score, topic }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, padding: 40, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
        Workflow Complete!
      </h2>
      <p style={{ fontSize: 16, color: '#888', marginBottom: 28, maxWidth: 380, lineHeight: 1.6 }}>
        You completed <strong>{topic || 'this topic'}</strong>
        {score !== null && score !== undefined && (
          <> with a final score of <strong style={{ color: '#1D9E75' }}>{score}%</strong></>
        )}
      </p>
      <div style={{
        background: '#E1F5EE', borderRadius: 16,
        padding: '20px 40px', marginBottom: 32, display: 'flex', gap: 40,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#1D9E75' }}>
            {score ?? '—'}%
          </p>
          <p style={{ fontSize: 13, color: '#0F6E56' }}>Final score</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#7F77DD' }}>
            {WORKFLOW_STEPS.length}
          </p>
          <p style={{ fontSize: 13, color: '#534AB7' }}>Steps completed</p>
        </div>
      </div>
      <button
        onClick={onBack}
        style={{
          padding: '14px 36px', borderRadius: 12, border: 'none',
          background: '#7F77DD', color: '#fff',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}
      >
        ← Back to dashboard
      </button>
    </div>
  )
}

// ─── Main runner ──────────────────────────────────────────────────────────────
export default function StudentWorkflowRunner({ workflow, onBack }) {
  const {
    nodeStatus, nodeOutputs, scores, activeTopic,
    setActiveTopic, setWorkflowProgress,
  } = useWorkflowStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Set topic from the assigned workflow
  useState(() => {
    if (workflow?.topic && !activeTopic) {
      setActiveTopic(workflow.topic)
    }
  })

  const step = WORKFLOW_STEPS[currentStep]
  const NodeComponent = step ? NODE_COMPONENTS[step.type] : null

  const currentNodeStatus = step ? (nodeStatus[step.id] || 'pending') : 'pending'
  const isCurrentDone =
    currentNodeStatus === 'done' ||
    currentNodeStatus === 'escalated' ||
    currentNodeStatus === 'submitted' ||
    nodeOutputs[step?.id]?.reviewed ||
    nodeOutputs[step?.id]?.submitted

  const conditionBranch = nodeOutputs['5']?.branch
  const latestScore = scores['4'] ?? null

  function goNext() {
    if (!step) return

    if (step.type === 'conditionNode') {
      if (conditionBranch === 'pass') {
        // Mark workflow complete and show completion screen
        if (workflow?.id) setWorkflowProgress(workflow.id, 'complete')
        setIsComplete(true)
        return
      } else {
        setCurrentStep(4) // weak spot detector
        return
      }
    }

    if (step.type === 'weakSpotDetector') {
      setCurrentStep(0) // loop back to resources
      return
    }

    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      // Mark in-progress after first step
      if (workflow?.id) setWorkflowProgress(workflow.id, 'in-progress')
    }
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  // Determine Next button label
  function getNextLabel() {
    if (!isCurrentDone) return 'Complete this step to continue'
    if (step?.type === 'conditionNode') {
      if (!conditionBranch) return 'Evaluate score first'
      return conditionBranch === 'pass' ? 'Complete workflow ✓' : 'Analyse my weak spots →'
    }
    if (step?.type === 'weakSpotDetector') return '↺ Restart with focused topic'
    return 'Next step →'
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#f9f9f9', fontFamily: 'sans-serif',
    }}>
      {/* Step indicator — always visible */}
      <StepIndicator
        steps={WORKFLOW_STEPS}
        currentIndex={currentStep}
        nodeStatus={nodeStatus}
      />

      {/* Either completion screen or active step */}
      {isComplete ? (
        <CompletionScreen
          onBack={onBack}
          score={latestScore}
          topic={workflow?.topic || activeTopic}
        />
      ) : (
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '28px 20px',
        }}>
          {/* Step header */}
          <div style={{ width: '100%', maxWidth: 520, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>{step?.icon}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
              {step?.title}
            </h2>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
              {step?.desc}
            </p>
          </div>

          {/* Node — rendered standalone (no React Flow handles) */}
          <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'center' }}>
            {NodeComponent && (
              <NodeComponent
                id={step.id}
                data={{}}
                standalone={true}
              />
            )}
          </div>

          {/* Score hint on condition step */}
          {step?.type === 'conditionNode' && latestScore !== null && (
            <div style={{
              width: '100%', maxWidth: 520, marginTop: 12,
              background: '#EEEDFE', borderRadius: 10, padding: '10px 16px',
              fontSize: 13, color: '#3C3489', textAlign: 'center',
            }}>
              Your quiz score: <strong>{latestScore}%</strong>
              {latestScore >= 70
                ? ' — Great! Click Evaluate score to confirm your pass.'
                : ' — Click Evaluate, then AI will help identify what to improve.'}
            </div>
          )}

          {/* Navigation */}
          <div style={{ width: '100%', maxWidth: 520, marginTop: 20, display: 'flex', gap: 10 }}>
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 10,
                border: '1px solid #eee', background: '#fff',
                color: currentStep === 0 ? '#ddd' : '#888',
                fontWeight: 600, fontSize: 14,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>
            <button
              onClick={goNext}
              disabled={!isCurrentDone || (step?.type === 'conditionNode' && !conditionBranch)}
              style={{
                flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
                background: isCurrentDone && !(step?.type === 'conditionNode' && !conditionBranch)
                  ? '#1D9E75' : '#ccc',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: isCurrentDone && !(step?.type === 'conditionNode' && !conditionBranch)
                  ? 'pointer' : 'not-allowed',
              }}
            >
              {getNextLabel()}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}