import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/useTheme'
import App from './App'
import './index.css'

// Error boundary to catch and display render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[React Error]', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px', background: '#0f0f1a', color: '#e0e0e0',
          fontFamily: 'monospace', height: '100vh', overflow: 'auto'
        }}>
          <h1 style={{ color: '#ff4444', fontSize: '20px', marginBottom: '16px' }}>
            ⚠️ React Rendering Error
          </h1>
          <pre style={{
            background: '#1a1a2e', padding: '16px', borderRadius: '8px',
            fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

// Global error handler for uncaught JS errors
window.addEventListener('error', (e) => {
  document.body.innerHTML = `
    <div style="padding:40px;background:#0f0f1a;color:#e0e0e0;font-family:monospace;height:100vh">
      <h1 style="color:#ff4444;font-size:20px;margin-bottom:16px">⚠️ Uncaught JS Error</h1>
      <pre style="background:#1a1a2e;padding:16px;border-radius:8px;font-size:13px;white-space:pre-wrap;word-break:break-all">
        ${e.message}
        ${e.error?.stack || ''}
      </pre>
    </div>
  `
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
