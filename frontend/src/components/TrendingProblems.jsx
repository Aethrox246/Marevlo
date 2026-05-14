import React, { useEffect, useState } from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadAllTopics } from '../utils/topicsLoader';

export default function TrendingProblems() {
    const navigate = useNavigate();
    const [topProblems, setTopProblems] = useState([]);

    useEffect(() => {
        loadAllTopics().then(topics => {
            const allProblems = topics.flatMap(t => t.problems);
            // Sort by likes descending, safely checking both direct likes and _raw.likes
            const sorted = allProblems
                .sort((a, b) => {
                    const likesA = a.likes || a._raw?.likes || 0;
                    const likesB = b.likes || b._raw?.likes || 0;
                    return likesB - likesA;
                })
                .slice(0, 3);
            setTopProblems(sorted);
        }).catch(err => console.error("Failed to load problems for trending:", err));
    }, []);

    const getDifficultyStyles = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return { diff: 'Easy', color: '#10b981' };
            case 'medium': return { diff: 'Medium', color: '#f59e0b' };
            case 'hard': return { diff: 'Hard', color: '#ef4444' };
            default: return { diff: 'Easy', color: '#10b981' };
        }
    };

    // Show skeletons or a loading state if empty, but we can just return null or the shell
    if (topProblems.length === 0) {
        return (
            <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
            }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                <div className="p-5 sm:p-6 opacity-50">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                        <Flame size={15} /> Trending Problems
                    </h3>
                    <div className="text-xs">Loading trending data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
        }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
            <div className="p-5 sm:p-6">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff'
                    }}>
                        <Flame size={15} />
                    </span>
                    <span style={{ color: 'var(--color-primary-text)' }}>Trending Problems</span>
                </h3>
                <div className="space-y-3">
                    {topProblems.map((problem, index) => {
                        const style = getDifficultyStyles(problem.difficulty || problem._raw?.difficulty);
                        return (
                            <div key={problem.id} onClick={() => navigate(`/ide/${problem.id}`)} className="flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-200" style={{
                                backgroundColor: 'var(--color-surface-hover)',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span style={{ color: 'var(--color-muted-text)', fontSize: '0.7rem', fontWeight: 700, width: 24, flexShrink: 0 }}>#{index + 1}</span>
                                    <span className="truncate" style={{ color: 'var(--color-primary-text)', fontSize: '0.82rem', fontWeight: 600 }}>{problem.title}</span>
                                </div>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
                                    color: style.color, background: `${style.color}18`, padding: '2px 8px', borderRadius: 999, flexShrink: 0
                                }}>
                                    {style.diff}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <button
                    onClick={() => navigate('/problems')}
                    className="w-full mt-4 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                        color: '#6366f1',
                        border: '1px solid rgba(99,102,241,0.25)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))';
                        e.currentTarget.style.color = '#6366f1';
                    }}
                >
                    View all problems <ArrowRight size={13} />
                </button>
            </div>
        </div>
    );
}
