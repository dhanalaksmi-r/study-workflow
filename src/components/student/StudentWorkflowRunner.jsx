// src/components/student/StudentWorkflowRunner.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/useAuth'
import StartNode from '../nodes/StartNode'
import ResourceCuratorNode from '../nodes/ResourceCuratorNode'
import FlashcardGeneratorNode from '../nodes/FlashcardGeneratorNode'
import QuizGeneratorNode from '../nodes/QuizGeneratorNode'
import ConditionNode from '../nodes/ConditionNode'
import WeakSpotDetectorNode from '../nodes/WeakSpotDetectorNode'

export default function StudentWorkflowRunner({ workflow, onBack }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Workflow state
  const [currentStep, setCurrentStep] = useState(0)
  const [topic, setTopic] = useState(workflow?.topic || '')
  const [focusedTopic, setFocusedTopic] = useState(null) // For loop-back
  const [retryCount, setRetryCount] = useState(0)
  
  // Node outputs
  const [quizScore, setQuizScore] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState(null)
  const [completed, setCompleted] = useState(false)

  // Step sequence
  const STEPS = [
    { id: 'start', label: '🎯', title: 'Set Topic' },
    { id: 'resources', label: '📚', title: 'Resources' },
    { id: 'flashcards', label: '🃏', title: 'Flashcards' },
    { id: 'quiz', label: '📝', title: 'Quiz' },
    { id: 'condition', label: '◆', title: 'Check Score' },
    { id: 'weakspot', label: '🔍', title: 'Analyse Gaps' }, // Only if retry
  ]

  // Determine which step to show (skip weakspot if passing)
  function getVisibleSteps() {
    if (!quizScore) return STEPS.slice(0, 5) // Up to condition
    if (quizScore >= 70) return STEPS.slice(0, 5) // Stop at condition (pass)
    return STEPS // Include weakspot (retry)
  }

  const visibleSteps = getVisibleSteps()
  const currentStepConfig = visibleSteps[currentStep]

  function handleTopicChange(newTopic) {
    setTopic(newTopic)
    nextStep()
  }

  function handleResourcesComplete() {
    nextStep()
  }

  function handleFlashcardsComplete() {
    nextStep()
  }

  function handleQuizComplete(data) {
    setQuizScore(data.score)
    setQuizQuestions(data.questions)
    setQuizAnswers(data.answers)
    nextStep()
  }

  function handleConditionPass() {
    // Save to database and mark complete
    console.log('Saving workflow completion:', { 
      workflowId: workflow?.id, 
      userId: user?.id, 
      score: quizScore 
    })
    saveWorkflowCompletion('complete', quizScore)
    setCompleted(true)
  }

  function handleConditionRetry() {
    // Go to WeakSpot detector
    nextStep()
  }

  function handleLoopBack(gap) {
    // Reset quiz and go back to resources with focused topic
    setFocusedTopic(gap)
    setQuizScore(null)
    setQuizQuestions(null)
    setQuizAnswers(null)
    setRetryCount(retryCount + 1)
    
    // Go back to resources step
    setCurrentStep(1) // Index of resources step
  }

  function nextStep() {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function saveWorkflowCompletion(status, score) {
    try {
      console.log('saveWorkflowCompletion called:', { status, score, workflowId: workflow?.id, userId: user?.id })
      
      if (!user?.id || !workflow?.id) {
        console.error('Missing user or workflow ID', { userId: user?.id, workflowId: workflow?.id })
        return
      }

      const payload = {
        workflow_id: workflow.id,
        student_id: user.id,
        status,
        last_score: score
      }

      console.log('Inserting payload:', payload)

      const { data, error } = await supabase
        .from('workflow_runs')
        .insert([payload])
        .select()

      if (error) {
        console.error('❌ Database insert error:', error)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      
      console.log('✅ Workflow saved to database:', data)
    } catch (err) {
      console.error('❌ Error saving workflow:', err.message || err)
    }
  }

  if (completed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f9f9f9',
        padding: 20,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>🎉</p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
            Workflow Complete!
          </h2>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1D9E75', marginBottom: 16 }}>
            {quizScore}% Final Score
          </p>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
            Great work! You've completed the workflow on <strong>{focusedTopic || topic}</strong>.
          </p>

          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#7F77DD',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f9f9f9',
      padding: '24px 20px',
      fontFamily: 'sans-serif'
    }}>
      {/* Step indicators */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {visibleSteps.map((step, i) => (
          <div
            key={step.id}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              background: i < currentStep ? '#1D9E75'
                : i === currentStep ? '#7F77DD'
                : '#eee',
              color: i <= currentStep ? '#fff' : '#bbb',
              fontWeight: 700,
              cursor: i < currentStep ? 'pointer' : 'default',
              transition: 'all 0.3s'
            }}
            onClick={() => i < currentStep && setCurrentStep(i)}
            title={step.title}
          >
            {step.label}
          </div>
        ))}
      </div>

      {/* Current step */}
      <div style={{
        width: '100%',
        maxWidth: 560,
        marginBottom: 20
      }}>
        {currentStepConfig?.id === 'start' && (
          <StartNode
            id="start"
            topic={topic}
            onTopicChange={setTopic}
            onNext={nextStep}
          />
        )}

        {currentStepConfig?.id === 'resources' && (
          <ResourceCuratorNode
            id="resources"
            topic={focusedTopic || topic}
            onComplete={handleResourcesComplete}
          />
        )}

        {currentStepConfig?.id === 'flashcards' && (
          <FlashcardGeneratorNode
            id="flashcards"
            topic={focusedTopic || topic}
            onComplete={handleFlashcardsComplete}
          />
        )}

        {currentStepConfig?.id === 'quiz' && (
          <QuizGeneratorNode
            id="quiz"
            topic={focusedTopic || topic}
            onComplete={handleQuizComplete}
          />
        )}

        {currentStepConfig?.id === 'condition' && (
          <ConditionNode
            id="condition"
            lastScore={quizScore}
            onPass={handleConditionPass}
            onRetry={handleConditionRetry}
          />
        )}

        {currentStepConfig?.id === 'weakspot' && (
          <WeakSpotDetectorNode
            id="weakspot"
            topic={focusedTopic || topic}
            quizQuestions={quizQuestions}
            quizAnswers={quizAnswers}
            onLoopBack={handleLoopBack}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        width: '100%',
        maxWidth: 560,
        justifyContent: 'space-between'
      }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            color: currentStep === 0 ? '#ddd' : '#888',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          ← Previous
        </button>

        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            color: '#888',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Exit Workflow
        </button>
      </div>

      {/* Progress info */}
      <p style={{
        fontSize: 12,
        color: '#aaa',
        marginTop: 16,
        textAlign: 'center'
      }}>
        Step {currentStep + 1} of {visibleSteps.length}
        {focusedTopic && ` • Focused on: ${focusedTopic} (Retry ${retryCount})`}
      </p>
    </div>
  )
}