import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--color-muted-text)' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary-text)', margin: 0 }}>Something went wrong</p>
                    <p style={{ fontSize: '13px', margin: 0 }}>Reload the page to try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-text)' }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
