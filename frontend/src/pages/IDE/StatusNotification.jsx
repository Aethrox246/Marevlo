import React, { memo, useEffect, useState, useCallback } from 'react';
import { Check, AlertCircle, ArrowRight, X, Sparkles, Trophy, RefreshCw } from 'lucide-react';

/**
 * StatusNotification - Enhanced success/error notification overlay
 * Features:
 * - Theme-aware styling
 * - Smooth entrance/exit animations
 * - Auto-dismiss option
 * - Progress indicator for attempts
 * - Confetti effect for success
 */
const StatusNotification = memo(({
    status,
    attempts,
    onNext,
    onDismiss
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Animate entrance
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            setIsVisible(true);
            setIsExiting(false);
        } else {
            setIsVisible(false);
        }
    }, [status]);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss?.();
        }, 200);
    }, [onDismiss]);

    const handleNext = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onNext?.();
        }, 200);
    }, [onNext]);

    // Auto-dismiss error after 10 seconds
    useEffect(() => {
        if (status === 'error') {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [status, handleDismiss]);

    if (!isVisible && status !== 'success' && status !== 'error') return null;

    const animationClass = isExiting 
        ? 'notification-exit' 
        : 'notification-enter';

    return (
        <>
            <style>{`
                @keyframes notification-slide-in {
                    0% {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                @keyframes notification-slide-out {
                    0% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(100%) scale(0.9);
                    }
                }
                @keyframes notification-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes notification-shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(20px) rotate(360deg); opacity: 0; }
                }
                @keyframes success-icon-pop {
                    0% { transform: scale(0) rotate(-180deg); }
                    60% { transform: scale(1.2) rotate(10deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes progress-shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .notification-enter {
                    animation: notification-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .notification-exit {
                    animation: notification-slide-out 0.2s ease-out forwards;
                }
                .notification-card {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                }
                .notification-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                .notification-btn:active {
                    transform: scale(0.97);
                }
                .notification-btn-primary {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                }
                .notification-btn-primary:hover {
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
                    transform: translateY(-1px);
                }
                .notification-btn-secondary {
                    background: var(--color-surface-hover);
                    color: var(--color-primary-text);
                    border: 1px solid var(--color-border);
                }
                .notification-btn-secondary:hover {
                    background: color-mix(in srgb, var(--color-primary-text) 10%, var(--color-surface));
                }
                .notification-btn-ghost {
                    background: transparent;
                    color: var(--color-muted-text);
                    padding: 6px 12px;
                }
                .notification-btn-ghost:hover {
                    color: var(--color-primary-text);
                    background: var(--color-surface-hover);
                }
            `}</style>

            <div 
                className={animationClass}
                style={{
                    position: 'absolute',
                    top: 80,
                    right: 24,
                    zIndex: 50,
                    width: 340,
                }}
            >
                {status === 'success' && (
                    <div className="notification-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                        {/* Success Header with gradient */}
                        <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            padding: '20px 20px 16px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Decorative elements */}
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'success-icon-pop 0.5s ease forwards',
                                }}>
                                    <Trophy size={24} style={{ color: 'white' }} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>
                                        Accepted!
                                    </h3>
                                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: '4px 0 0' }}>
                                        All test cases passed
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Success Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ color: 'var(--color-muted-text)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                                Great job! Your solution is correct. Ready for the next challenge?
                            </p>
                            <button 
                                onClick={handleNext}
                                className="notification-btn notification-btn-primary"
                                style={{ width: '100%' }}
                            >
                                <Sparkles size={16} />
                                Next Problem
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="notification-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                        {/* Error Header */}
                        <div style={{
                            background: 'color-mix(in srgb, #ef4444 10%, var(--color-surface))',
                            padding: '16px 20px',
                            borderBottom: '1px solid color-mix(in srgb, #ef4444 20%, transparent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'color-mix(in srgb, #ef4444 15%, transparent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'notification-shake 0.4s ease',
                                }}>
                                    <AlertCircle size={20} style={{ color: '#ef4444' }} />
                                </div>
                                <div>
                                    <h3 style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, margin: 0 }}>
                                        Wrong Answer
                                    </h3>
                                    {attempts > 0 && (
                                        <p style={{ color: 'var(--color-muted-text)', fontSize: 11, margin: '2px 0 0' }}>
                                            Attempt #{attempts}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="notification-btn-ghost"
                                style={{ padding: 6, borderRadius: 6 }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Error Body */}
                        <div style={{ padding: 20 }}>
                            <p style={{ color: 'var(--color-muted-text)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                                {attempts <= 1 
                                    ? "Your code didn't produce the expected output. Check the test results and try again!"
                                    : "Still incorrect. Review your logic or check the hints for guidance."
                                }
                            </p>

                            {/* Attempts Progress */}
                            {attempts > 1 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: 6,
                                    }}>
                                        <span style={{ fontSize: 11, color: 'var(--color-muted-text)' }}>
                                            Attempts
                                        </span>
                                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                                            {attempts} tries
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 4, borderRadius: 2,
                                        background: 'var(--color-border)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(attempts * 20, 100)}%`,
                                            background: attempts >= 5 ? '#ef4444' : '#f59e0b',
                                            borderRadius: 2,
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button 
                                    onClick={handleDismiss}
                                    className="notification-btn notification-btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    <RefreshCw size={14} />
                                    Try Again
                                </button>
                                {attempts > 2 && (
                                    <button 
                                        onClick={handleNext}
                                        className="notification-btn notification-btn-ghost"
                                        style={{ 
                                            flex: 1,
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        Skip
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Auto-dismiss progress bar */}
                        <div style={{
                            height: 3,
                            background: 'var(--color-border)',
                        }}>
                            <div style={{
                                height: '100%',
                                background: '#ef4444',
                                animation: 'progress-shrink 10s linear forwards',
                            }} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});

StatusNotification.displayName = 'StatusNotification';

export default StatusNotification;

