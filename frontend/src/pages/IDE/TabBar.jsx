import React from 'react';

/**
 * TabBar - Navigation tabs for IDE sections, fully theme-dynamic
 */
const TabBar = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            padding: '12px 16px', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', position: 'relative',
                            color: isActive ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                            background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none'
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--color-primary-text)' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--color-muted-text)' }}
                    >
                        {tab.label}
                        {isActive && (
                            <div style={{ position: 'absolute', bottom: -1, left: 16, right: 16, height: 2, background: '#818cf8', borderRadius: '2px 2px 0 0', boxShadow: '0 -2px 8px rgba(129, 140, 248, 0.4)' }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default TabBar;
