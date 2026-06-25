// src/components/nodes/ConditionNode.jsx
import { useState } from 'react'

export default function ConditionNode({ id, lastScore, onPass, onRetry }) {
  const [evaluated, setEvaluated] = useState(false)
  const passThreshold = 70

  function evaluateScore() {
    if (lastScore === null || lastScore === undefined) {
      return
    }
    setEvaluated(true)
  }

  const isPassing = lastScore !== null && lastScore >= passThreshold

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: '2px solid #7F77DD',
      padding: 20,
      width: '100%',
      maxWidth: 520
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        ◆ Check Your Score
      </h3>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        AI evaluates your score and routes you forward.
      </p>

      {!evaluated ? (
        <div>
          {lastScore !== null ? (
            <div style={{
              background: '#EEEDFE',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              marginBottom: 16
            }}>
              <p style={{ fontSize: 12, color: '#534AB7', marginBottom: 8 }}>
                Your quiz score:
              </p>
              <p style={{
                fontSize: 48,
                fontWeight: 800,
                color: lastScore >= 70 ? '#1D9E75' : '#E24B4A',
                marginBottom: 4
              }}>
                {lastScore}%
              </p>
              <p style={{ fontSize: 12, color: '#534AB7' }}>
                {lastScore >= 70
                  ? '✓ Great job! Click evaluate to confirm.'
                  : '↻ Below threshold. AI will identify the gap.'}
              </p>
            </div>
          ) : (
            <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 16 }}>
              ⚠ No quiz score found. Complete the quiz first.
            </p>
          )}

          <button
            onClick={evaluateScore}
            disabled={lastScore === null}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: lastScore !== null ? '#7F77DD' : '#ccc',
              color: '#fff',
              fontWeight: 600,
              cursor: lastScore !== null ? 'pointer' : 'not-allowed'
            }}
          >
            Evaluate Score
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            background: isPassing ? '#E1F5EE' : '#FAEEDA',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            textAlign: 'center',
            border: `1px solid ${isPassing ? '#5DCAA5' : '#EF9F27'}`
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              color: isPassing ? '#0F6E56' : '#633806',
              marginBottom: 8,
              textTransform: 'uppercase'
            }}>
              {isPassing ? 'PASS' : 'RETRY RECOMMENDED'}
            </p>
            <p style={{
              fontSize: 14,
              color: isPassing ? '#085041' : '#633806',
              lineHeight: 1.6
            }}>
              {isPassing
                ? 'Excellent! You\'ve met the threshold and can move forward.'
                : 'Let\'s identify the specific gap and refocus your learning.'}
            </p>
          </div>

          {isPassing ? (
            <button
              onClick={() => onPass?.()}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#1D9E75',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Complete Workflow ✓
            </button>
          ) : (
            <button
              onClick={() => onRetry?.()}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#EF9F27',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Analyse My Gaps →
            </button>
          )}
        </div>
      )}
    </div>
  )
}