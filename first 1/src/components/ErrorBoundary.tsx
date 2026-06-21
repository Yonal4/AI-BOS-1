import { Component, ReactNode } from 'react'
import { C } from '../design'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Inter',system-ui,sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(240,106,64,0.15)', border: '0.5px solid rgba(240,106,64,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 20px' }}>⚠</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', marginBottom: 20 }}>The app hit an unexpected error. Details below.</p>
            <div style={{ background: 'rgba(240,106,64,0.06)', border: '0.5px solid rgba(240,106,64,0.2)', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: C.coral, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
              {this.state.error.message}
              {this.state.error.stack ? '\n\n' + this.state.error.stack.split('\n').slice(0, 6).join('\n') : ''}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { this.setState({ error: null }); window.location.reload() }}
                style={{ padding: '10px 24px', background: C.purple, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
