import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SkillOS React ErrorBoundary Caught Exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => { window.location.reload(); };
  handleGoHome = () => { window.location.href = '/'; };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
        >
          <div
            className="max-w-md w-full p-8 rounded-3xl space-y-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: 'var(--danger)' }} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                Something Went Wrong
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                An unexpected error occurred. Your career data is safe — please reload the page.
              </p>
            </div>

            {this.state.error && (
              <div
                className="p-3.5 rounded-xl text-xs font-mono text-left overflow-x-auto max-h-36"
                style={{ background: 'var(--surface-elevated)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button onClick={this.handleReload} className="btn-primary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button onClick={this.handleGoHome} className="btn-secondary flex items-center gap-2">
                <Home className="w-4 h-4" /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
