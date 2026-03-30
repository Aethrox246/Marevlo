import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import './AlgorithmVisualizer.css';

const AlgorithmVisualizer = ({ steps, algorithmType = 'palindrome', inputData = {} }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);

    const step = steps[currentStep] || null;

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying || !step) return;
        const timer = setTimeout(() => {
            setCurrentStep(prev =>
                prev < steps.length - 1 ? prev + 1 : prev
            );
        }, 1000 / speed);
        return () => clearTimeout(timer);
    }, [isPlaying, currentStep, steps.length, speed]);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handlePrevious = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
        setIsPlaying(false);
    }, []);

    const handleNext = useCallback(() => {
        setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
    }, [steps.length]);

    const handleSpeedChange = (e) => {
        setSpeed(parseFloat(e.target.value));
    };

    const handleStepChange = (e) => {
        setCurrentStep(Math.min(parseInt(e.target.value), steps.length - 1));
        setIsPlaying(false);
    };

    if (!step || steps.length === 0) {
        return (
            <div className="visualizer-container">
                <div className="empty-state">No visualization data available</div>
            </div>
        );
    }

    return (
        <div className="visualizer-container">
            {/* Header */}
            <div className="visualizer-header">
                <span className="algorithm-type">{algorithmType.toUpperCase()}</span>
            </div>

            {/* Visualization Area */}
            <div className="visualization-area">
                {algorithmType === 'palindrome' && (
                    <PalindromeVisualization step={step} inputString={inputData.string} />
                )}
                {algorithmType === 'valid-palindrome' && (
                    <ValidPalindromeVisualization step={step} />
                )}
                {algorithmType === 'parentheses' && (
                    <ParenthesesVisualization step={step} />
                )}
            </div>

            {/* Step Description */}
            <div className="step-description">
                <p>{step.description}</p>
                <div className="step-stats">
                    <span>Count: <strong>{step.count}</strong></span>
                </div>
            </div>

            {/* Controls */}
            <div className="controls">
                <div className="playback-controls">
                    <button
                        className="control-btn"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        title="Previous step"
                    >
                        <SkipBack size={16} />
                    </button>

                    <button
                        className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={handlePlayPause}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    <button
                        className="control-btn"
                        onClick={handleNext}
                        disabled={currentStep === steps.length - 1}
                        title="Next step"
                    >
                        <SkipForward size={16} />
                    </button>

                    <span className="step-counter">{currentStep + 1}/{steps.length}</span>
                </div>

                <div className="speed-control">
                    <select value={speed} onChange={handleSpeedChange} className="speed-select">
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                    </select>
                </div>
            </div>

            {/* Progress Slider */}
            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max={steps.length - 1}
                    value={currentStep}
                    onChange={handleStepChange}
                    className="progress-slider"
                />
            </div>
        </div>
    );
};

/**
 * Palindrome Visualization Component
 * Shows string with highlighted substring and character comparison pointers
 */
const PalindromeVisualization = ({ step, inputString }) => {
    const { substring, leftIndex, rightIndex, leftChar, rightChar, isMatching, isPalindrome, comparingPhase } = step;

    return (
        <div className="palindrome-viz">
            {/* String Display */}
            <div className="string-display">
                <div className="string-chars">
                    {inputString && inputString.split('').map((char, idx) => {
                        const isInSubstring = idx >= leftIndex && idx <= rightIndex;
                        const isLeftPointer = idx === leftIndex && comparingPhase;
                        const isRightPointer = idx === rightIndex && comparingPhase;

                        return (
                            <span
                                key={idx}
                                className={`char ${isInSubstring ? 'in-substring' : ''} ${
                                    isLeftPointer ? 'left-pointer' : ''
                                } ${isRightPointer ? 'right-pointer' : ''} ${
                                    isMatching && comparingPhase ? 'matching' : ''
                                } ${!isMatching && comparingPhase ? 'not-matching' : ''}`}
                                title={`Index ${idx}`}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Substring Info */}
            <div className="substring-info">
                <div className="info-row">
                    <span className="label">Substring:</span>
                    <span className="value">{substring}</span>
                </div>
                <div className="info-row">
                    <span className="label">Range:</span>
                    <span className="value">({leftIndex}-{rightIndex})</span>
                </div>
            </div>

            {/* Comparison Info */}
            {comparingPhase && (
                <div className="comparison-info">
                    <div className="comparison">
                        <span className={`char-display ${isMatching ? 'match' : 'no-match'}`}>
                            '{leftChar}' vs '{rightChar}'
                        </span>
                        <span className={`result ${isMatching ? 'match' : 'no-match'}`}>
                            {isMatching ? '✓ MATCH' : '✗ NO MATCH'}
                        </span>
                    </div>
                </div>
            )}

            {/* Palindrome Result */}
            <div className={`palindrome-result ${isPalindrome ? 'yes' : 'no'}`}>
                <span className="status">{isPalindrome ? 'YES' : 'NO'}</span>
                <span className="text">Palindrome</span>
            </div>
        </div>
    );
};

/**
 * Parentheses Visualization Component
 * Shows string being built, depth, validity checks for recursive generation
 */
const ParenthesesVisualization = ({ step }) => {
    const { type, currentString, n, isValid, depth } = step;

    // Determine color/status style based on the action type
    let statusClass = 'neutral';
    if (type === 'found' || isValid === true) statusClass = 'success';
    if (isValid === false) statusClass = 'error';
    if (type === 'add-open') statusClass = 'highlight-open';
    if (type === 'add-close') statusClass = 'highlight-close';

    // The currentString might be undefined initially
    const str = currentString || '';
    const maxLen = (n || 0) * 2;

    return (
        <div className="parentheses-viz">
            {/* Progress / Depth Indicators */}
            <div className="viz-stats">
                <div className="stat-box">
                    <span className="stat-label">Target (n)</span>
                    <span className="stat-value">{n || '-'}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Length</span>
                    <span className="stat-value">{str.length} / {maxLen}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Action</span>
                    <span className={`stat-value badge ${statusClass}`}>{type?.toUpperCase()}</span>
                </div>
            </div>

            {/* String Builder Display */}
            <div className="string-builder-display">
                <div className="string-slots">
                    {Array.from({ length: Math.max(maxLen, str.length) }).map((_, idx) => {
                        const char = idx < str.length ? str[idx] : '';
                        const isNewlyAdded = idx === str.length - 1 && (type === 'add-open' || type === 'add-close' || type === 'explore');
                        
                        return (
                            <span 
                                key={idx} 
                                className={`char-slot ${char ? 'filled' : 'empty'} ${isNewlyAdded ? 'new-char ' + statusClass : ''}`}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Validation Info if applicable */}
            {(isValid !== null && isValid !== undefined) && (
                <div className={`validation-result ${statusClass}`}>
                    <span className="status">
                        {isValid === true ? '✓ VALID COMBINATION' : '✗ INVALID PATH'}
                    </span>
                </div>
            )}
        </div>
    );
};

/**
 * Valid Palindrome Visualization Component
 * Shows string with two pointers checking from outside in
 */
const ValidPalindromeVisualization = ({ step }) => {
    const { inputString, left, right, matchStatus, isPalindrome, type } = step;

    return (
        <div className="palindrome-viz valid-palindrome-viz">
            {/* String Display */}
            <div className="string-display">
                <div className="string-chars">
                    {inputString && inputString.split('').map((char, idx) => {
                        const isLeftPointer = idx === left;
                        const isRightPointer = idx === right;

                        let extraClass = '';
                        if (type === 'compare') {
                            if (isLeftPointer || isRightPointer) {
                                if (matchStatus === 'match') extraClass = 'matching';
                                else if (matchStatus === 'mismatch') extraClass = 'not-matching';
                                else extraClass = isLeftPointer ? 'left-pointer' : 'right-pointer'; // For 'end' or other cases
                            }
                        } else if (type === 'initial') {
                            if (isLeftPointer) extraClass = 'left-pointer';
                            if (isRightPointer) extraClass = 'right-pointer';
                        }

                        return (
                            <span
                                key={idx}
                                className={`char ${extraClass}`}
                                title={`Index ${idx}`}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Comparison Info */}
            {type === 'compare' && matchStatus !== 'end' && (
                <div className="comparison-info">
                    <div className="comparison">
                        <span className={`char-display ${matchStatus === 'match' ? 'match' : 'no-match'}`}>
                            '{inputString[left]}' vs '{inputString[right]}'
                        </span>
                        <span className={`result ${matchStatus === 'match' ? 'match' : 'no-match'}`}>
                            {matchStatus === 'match' ? '✓ MATCH' : '✗ NO MATCH'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Loop Ends Info */}
            {type === 'compare' && matchStatus === 'end' && (
                <div className="comparison-info">
                    <div className="comparison" style={{ justifyContent: 'center' }}>
                        <span className="result match">
                            ✓ LOOP ENDS (Left &gt;= Right)
                        </span>
                    </div>
                </div>
            )}

            {/* Result Info */}
            {type === 'result' && (
                <div className={`palindrome-result ${isPalindrome ? 'yes' : 'no'}`}>
                    <span className="status">{isPalindrome ? 'VALID' : 'INVALID'}</span>
                    <span className="text">Palindrome</span>
                </div>
            )}
        </div>
    );
};

export default AlgorithmVisualizer;
