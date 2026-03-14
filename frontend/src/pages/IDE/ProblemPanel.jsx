import React, { useMemo, memo, useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Lock, Unlock, ChevronRight, Lightbulb, Code, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TabBar from './TabBar';
import alienDictionaryData from '../../assets/alien-dictionary-full.json';

// Sample approaches data - in production, this would come from problem.approaches
const getSampleApproaches = (problemTitle) => [
    {
        id: 'brute-force',
        name: 'Brute Force',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        ladder: [
            { level: 1, type: 'hint', title: 'Think About It', content: 'Consider checking every possible combination to find the answer.' },
            { level: 2, type: 'hint', title: 'Loop Structure', content: 'You might need nested loops to compare elements pairwise.' },
            { level: 3, type: 'code-hint', title: 'Key Comparison', content: 'Compare elements at positions i and j where j > i.' },
            { level: 4, type: 'pseudocode', title: 'Pseudocode', content: 'for i in range(n):\n  for j in range(i+1, n):\n    if condition_met:\n      return result' },
            { level: 5, type: 'partial-code', title: 'Partial Solution', content: 'The outer loop iterates through each element. The inner loop checks all subsequent elements.' },
            { level: 6, type: 'full-solution', title: 'Full Solution', content: '# Complete brute force implementation\ndef solve(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(i+1, n):\n            # Add your logic here\n            pass\n    return result' }
        ]
    },
    {
        id: 'two-pointer',
        name: 'Two Pointer',
        complexity: { time: 'O(n)', space: 'O(1)' },
        ladder: [
            { level: 1, type: 'hint', title: 'Basic Idea', content: 'Use two pointers that move towards each other or in the same direction.' },
            { level: 2, type: 'hint', title: 'Pointer Placement', content: 'Start with one pointer at the beginning and one at the end of the array.' },
            { level: 3, type: 'code-hint', title: 'Movement Logic', content: 'Move left pointer right if sum is too small, move right pointer left if sum is too large.' },
            { level: 4, type: 'pseudocode', title: 'Pseudocode', content: 'left, right = 0, n-1\nwhile left < right:\n  current = arr[left] + arr[right]\n  if current == target: return\n  elif current < target: left += 1\n  else: right -= 1' },
            { level: 5, type: 'partial-code', title: 'Partial Solution', content: 'Initialize left=0 and right=len(arr)-1. Use a while loop that continues while left < right.' },
            { level: 6, type: 'full-solution', title: 'Full Solution', content: '# Two pointer approach (requires sorted array)\ndef solve(arr, target):\n    arr_sorted = sorted(enumerate(arr), key=lambda x: x[1])\n    left, right = 0, len(arr) - 1\n    while left < right:\n        curr_sum = arr_sorted[left][1] + arr_sorted[right][1]\n        if curr_sum == target:\n            return [arr_sorted[left][0], arr_sorted[right][0]]\n        elif curr_sum < target:\n            left += 1\n        else:\n            right -= 1\n    return []' }
        ]
    },
    {
        id: 'hash-map',
        name: 'Hash Map',
        complexity: { time: 'O(n)', space: 'O(n)' },
        ladder: [
            { level: 1, type: 'hint', title: 'Data Structure', content: 'Think about using a data structure for O(1) lookups.' },
            { level: 2, type: 'hint', title: 'Hash Map', content: 'A hash map can store values you\'ve already seen.' },
            { level: 3, type: 'code-hint', title: 'Key Insight', content: 'For each element, check if its complement exists in the map.' },
            { level: 4, type: 'pseudocode', title: 'Pseudocode', content: 'seen = {}\nfor i, num in enumerate(arr):\n  if complement in seen:\n    return answer\n  seen[num] = i' },
            { level: 5, type: 'partial-code', title: 'Partial Solution', content: 'Initialize an empty dictionary. As you iterate, store each element and its index.' },
            { level: 6, type: 'full-solution', title: 'Full Solution', content: '# Hash Map O(n) solution\ndef solve(arr, target):\n    seen = {}\n    for i, num in enumerate(arr):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []' }
        ]
    },
    {
        id: 'sorting',
        name: 'Sorting',
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        ladder: [
            { level: 1, type: 'hint', title: 'Pre-processing', content: 'What if the array was sorted? Would that make the problem easier?' },
            { level: 2, type: 'hint', title: 'Sort First', content: 'Sort the array while keeping track of original indices.' },
            { level: 3, type: 'code-hint', title: 'Binary Search', content: 'After sorting, use binary search to find the complement of each element.' },
            { level: 4, type: 'pseudocode', title: 'Pseudocode', content: 'indexed_arr = [(val, idx) for idx, val in enumerate(arr)]\nindexed_arr.sort()\nfor each element:\n  binary_search for complement' },
            { level: 5, type: 'partial-code', title: 'Partial Solution', content: 'Create tuples of (value, original_index), sort by value, then use binary search.' },
            { level: 6, type: 'full-solution', title: 'Full Solution', content: '# Sorting + Binary Search\nimport bisect\ndef solve(arr, target):\n    indexed = sorted(enumerate(arr), key=lambda x: x[1])\n    values = [x[1] for x in indexed]\n    for i, (orig_idx, val) in enumerate(indexed):\n        complement = target - val\n        j = bisect.bisect_left(values, complement)\n        if j < len(values) and values[j] == complement and j != i:\n            return sorted([orig_idx, indexed[j][0]])\n    return []' }
        ]
    },
    {
        id: 'divide-conquer',
        name: 'Divide & Conquer',
        complexity: { time: 'O(n log n)', space: 'O(log n)' },
        ladder: [
            { level: 1, type: 'hint', title: 'Split the Problem', content: 'Can you divide the array into smaller subproblems?' },
            { level: 2, type: 'hint', title: 'Recursive Thinking', content: 'Solve for left half, right half, then combine results.' },
            { level: 3, type: 'code-hint', title: 'Cross Boundary', content: 'Don\'t forget pairs where one element is in left half and one is in right half.' },
            { level: 4, type: 'pseudocode', title: 'Pseudocode', content: 'def solve(arr, left, right):\n  if left >= right: return None\n  mid = (left + right) // 2\n  result = solve(left, mid) or solve(mid+1, right)\n  if result: return result\n  return check_cross_boundary(mid)' },
            { level: 5, type: 'partial-code', title: 'Partial Solution', content: 'Recursively solve left and right halves. If not found, check pairs crossing the midpoint.' },
            { level: 6, type: 'full-solution', title: 'Full Solution', content: '# Divide and Conquer approach\ndef solve(arr, target):\n    def helper(indices):\n        if len(indices) <= 1:\n            return None\n        mid = len(indices) // 2\n        left = helper(indices[:mid])\n        if left: return left\n        right = helper(indices[mid:])\n        if right: return right\n        # Check cross boundary\n        left_set = {arr[i]: i for i in indices[:mid]}\n        for i in indices[mid:]:\n            comp = target - arr[i]\n            if comp in left_set:\n                return [left_set[comp], i]\n        return None\n    return helper(list(range(len(arr)))) or []' }
        ]
    }
];

const approachDataBySlug = {
    'alien-dictionary-full': alienDictionaryData
};

const normalizeApproaches = (raw) => {
    if (!raw || !Array.isArray(raw.solution_approaches)) return [];
    return raw.solution_approaches.map((approach) => ({
        id: approach.approach_id,
        name: approach.name,
        complexity: {
            time: approach.overall_complexity?.time || 'N/A',
            space: approach.overall_complexity?.space || 'N/A'
        },
        ladder: (approach.ladders || []).map((step) => ({
            level: parseInt(String(step.step_id || '').replace('L', ''), 10) || 1,
            type: 'hint',
            title: step.title || `Level ${step.step_id}`,
            content: step.instruction || ''
        }))
    }));
};

/**
 * ProblemPanel - Theme-aware problem description panel with Approaches & Ladder
 */
const ProblemPanel = memo(({ problem, onBack }) => {
    const [activeTab, setActiveTab] = useState('description');
    const [selectedApproach, setSelectedApproach] = useState(0);
    const [unlockedLevels, setUnlockedLevels] = useState({});
    
    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'approaches', label: 'Approaches' }
    ];
    
    // Get approaches for current problem
    const approaches = useMemo(() => {
        if (!problem) return [];
        const raw = approachDataBySlug[problem.slug];
        const normalized = normalizeApproaches(raw);
        return normalized.length > 0 ? normalized : getSampleApproaches(problem?.title);
    }, [problem]);

    useEffect(() => {
        if (!approaches.length) return;
        const initial = {};
        approaches.forEach(a => { initial[a.id] = 1; });
        setUnlockedLevels(initial);
        setSelectedApproach(0);
    }, [approaches]);

    const fullDescription = useMemo(() => {
        if (!problem) return "";
        const cleanDesc = (problem.description || "")
            .replace(/(?:Example \d:|Constraints:)[\s\S]*/, '')
            .trim();
        let desc = `${cleanDesc} \n\n`;
        if (problem.examples && problem.examples.length > 0) {
            desc += `### Examples\n\n`;
            problem.examples.forEach(ex => {
                desc += `**Example ${ex.example_num}:**\n`;
                desc += "```\n" + ex.example_text + "\n```\n\n";
            });
        }
        if (problem.constraints && problem.constraints.length > 0) {
            desc += `### Constraints\n\n`;
            desc += problem.constraints.map(c => `- \`${c}\``).join('\n');
        }
        return desc;
    }, [problem]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'Hard': return '#ef4444';
            default: return 'var(--color-muted-text)';
        }
    };

    // Unlock next level for current approach
    const unlockNextLevel = () => {
        const currentApproach = approaches[selectedApproach];
        if (!currentApproach) return;
        
        const currentLevel = unlockedLevels[currentApproach.id] || 1;
        if (currentLevel < 6) {
            setUnlockedLevels(prev => ({
                ...prev,
                [currentApproach.id]: currentLevel + 1
            }));
        }
    };

    // Get icon for level type
    const getLevelIcon = (type, isUnlocked) => {
        if (!isUnlocked) return <Lock size={14} />;
        switch (type) {
            case 'hint': return <Lightbulb size={14} />;
            case 'code-hint': return <Code size={14} />;
            case 'pseudocode': return <Code size={14} />;
            case 'partial-code': return <Code size={14} />;
            case 'full-solution': return <CheckCircle2 size={14} />;
            default: return <Lightbulb size={14} />;
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

            {/* Problem Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-primary-text)', marginBottom: 12, lineHeight: 1.4 }}>
                    {problem.id}. {problem.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: getDifficultyColor(problem.difficulty) }}>
                        {problem.difficulty}
                    </span>
                    {problem.tags && problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: 'var(--color-surface-hover)',
                            color: 'var(--color-muted-text)',
                            border: '1px solid var(--color-border)'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--color-muted-text)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ThumbsUp size={15} /> 67.5K
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ThumbsDown size={15} /> 1.2K
                    </span>
                </div>
            </div>

            {/* Problem Description */}
            {activeTab === 'description' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ color: 'var(--color-primary-text)', fontSize: 14, lineHeight: 1.7 }}>
                        <ReactMarkdown>{fullDescription}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Approaches & Ladder Tab */}
            {activeTab === 'approaches' && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Approach Selector Tabs */}
                    <div style={{ 
                        display: 'flex', 
                        gap: 8, 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        flexWrap: 'wrap'
                    }}>
                        {approaches.map((approach, index) => (
                            <button
                                key={approach.id}
                                onClick={() => setSelectedApproach(index)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: selectedApproach === index 
                                        ? 'var(--color-primary-text)' 
                                        : 'var(--color-surface-hover)',
                                    color: selectedApproach === index 
                                        ? 'var(--color-surface)' 
                                        : 'var(--color-muted-text)'
                                }}
                            >
                                {approach.name}
                            </button>
                        ))}
                    </div>

                    {/* Complexity Info */}
                    {approaches[selectedApproach] && (
                        <div style={{ 
                            padding: '12px 16px', 
                            background: 'var(--color-surface-hover)',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            gap: 24,
                            fontSize: 13
                        }}>
                            <span style={{ color: 'var(--color-muted-text)' }}>
                                Time: <span style={{ color: '#10b981', fontWeight: 600 }}>{approaches[selectedApproach].complexity.time}</span>
                            </span>
                            <span style={{ color: 'var(--color-muted-text)' }}>
                                Space: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{approaches[selectedApproach].complexity.space}</span>
                            </span>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {approaches[selectedApproach] && (
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 12, color: 'var(--color-muted-text)', marginBottom: 8 }}>
                                Progress: Level {unlockedLevels[approaches[selectedApproach].id] || 1} of 6
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {[1, 2, 3, 4, 5, 6].map(level => {
                                    const currentUnlocked = unlockedLevels[approaches[selectedApproach].id] || 1;
                                    const isUnlocked = level <= currentUnlocked;
                                    return (
                                        <React.Fragment key={level}>
                                            <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: isUnlocked ? '#10b981' : 'var(--color-surface-hover)',
                                                color: isUnlocked ? '#fff' : 'var(--color-muted-text)',
                                                border: isUnlocked ? 'none' : '1px solid var(--color-border)',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {isUnlocked ? '✓' : level}
                                            </div>
                                            {level < 6 && (
                                                <div style={{
                                                    flex: 1,
                                                    height: 2,
                                                    background: level < currentUnlocked ? '#10b981' : 'var(--color-border)',
                                                    transition: 'background 0.3s ease'
                                                }} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ladder Levels */}
                    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {approaches[selectedApproach]?.ladder.map((item, index) => {
                            const currentUnlocked = unlockedLevels[approaches[selectedApproach].id] || 1;
                            const isUnlocked = item.level <= currentUnlocked;
                            const isNext = item.level === currentUnlocked + 1;
                            
                            return (
                                <div
                                    key={item.level}
                                    style={{
                                        padding: '16px',
                                        borderRadius: 12,
                                        border: '1px solid var(--color-border)',
                                        background: isUnlocked 
                                            ? 'var(--color-surface)' 
                                            : 'var(--color-surface-hover)',
                                        opacity: isUnlocked ? 1 : 0.6,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {/* Level Header */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 10, 
                                        marginBottom: isUnlocked ? 12 : 0 
                                    }}>
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: isUnlocked ? '#10b98120' : 'var(--color-border)',
                                            color: isUnlocked ? '#10b981' : 'var(--color-muted-text)'
                                        }}>
                                            {getLevelIcon(item.type, isUnlocked)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: 14, 
                                                fontWeight: 600, 
                                                color: isUnlocked ? 'var(--color-primary-text)' : 'var(--color-muted-text)'
                                            }}>
                                                Level {item.level}: {item.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-muted-text)', textTransform: 'capitalize' }}>
                                                {item.type.replace('-', ' ')}
                                            </div>
                                        </div>
                                        {!isUnlocked && (
                                            <Lock size={16} style={{ color: 'var(--color-muted-text)' }} />
                                        )}
                                    </div>

                                    {/* Level Content */}
                                    {isUnlocked && (
                                        <div style={{
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                            color: 'var(--color-primary-text)',
                                            padding: '12px',
                                            background: 'var(--color-surface-hover)',
                                            borderRadius: 8,
                                            fontFamily: item.type.includes('code') || item.type === 'pseudocode' || item.type === 'full-solution'
                                                ? "'Consolas', 'Monaco', monospace"
                                                : 'inherit',
                                            whiteSpace: item.type.includes('code') || item.type === 'pseudocode' || item.type === 'full-solution'
                                                ? 'pre-wrap'
                                                : 'normal'
                                        }}>
                                            {item.content}
                                        </div>
                                    )}

                                    {/* Unlock Button for next level */}
                                    {isNext && (
                                        <button
                                            onClick={unlockNextLevel}
                                            style={{
                                                marginTop: 12,
                                                width: '100%',
                                                padding: '10px 16px',
                                                borderRadius: 8,
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: '#fff',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <Unlock size={14} />
                                            Unlock Level {item.level}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

ProblemPanel.displayName = 'ProblemPanel';
export default ProblemPanel;
