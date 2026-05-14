import React, { useRef, useState, useEffect } from 'react';

const TabBar = ({ activeTab, onTabChange, tabs }) => {
    const containerRef = useRef(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const btn = containerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
        if (btn) {
            const cr = containerRef.current.getBoundingClientRect();
            const br = btn.getBoundingClientRect();
            setIndicator({ left: br.left - cr.left, width: br.width });
        }
    }, [activeTab, tabs]);

    return (
        <div ref={containerRef} style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px',
            position: 'relative', borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
        }}>
            {tabs.map(tab => (
                <button key={tab.id} data-tab-id={tab.id} onClick={() => onTabChange(tab.id)}
                    style={{
                        padding: '13px 16px', fontSize: 13, fontWeight: 600,
                        color: activeTab === tab.id ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        outline: 'none', transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-primary-text)'; }}
                    onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-muted-text)'; }}
                >{tab.label}</button>
            ))}
            <div style={{
                position: 'absolute', bottom: -1, left: indicator.left, width: indicator.width,
                height: 2, borderRadius: '2px 2px 0 0', background: '#818cf8',
                boxShadow: '0 -2px 8px rgba(129,140,248,0.35)',
                transition: 'left .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1)',
                pointerEvents: 'none',
            }} />
        </div>
    );
};

export default TabBar;
