import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Layers, Users, Briefcase, Code, Terminal, Globe, ArrowUpRight, CheckCircle2, Zap, MessageSquare, Brain, Cpu, GitBranch } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Animated Typing Terminal
const CODE_SNIPPETS = [
    {
        label: 'DSA · Two Pointers',
        file: 'two_sum.py',
        color: '#6366f1',
        lines: [
            { indent: 0, tokens: [{ t: 'comment', v: '# Two Sum — classic DSA problem' }] },
            { indent: 0, tokens: [{ t: 'keyword', v: 'def' }, { t: 'plain', v: ' ' }, { t: 'fn', v: 'two_sum' }, { t: 'plain', v: '(nums, target):' }] },
            { indent: 1, tokens: [{ t: 'plain', v: 'seen = {}' }] },
            { indent: 1, tokens: [{ t: 'keyword', v: 'for' }, { t: 'plain', v: ' i, n ' }, { t: 'keyword', v: 'in' }, { t: 'plain', v: ' ' }, { t: 'fn', v: 'enumerate' }, { t: 'plain', v: '(nums):' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'diff = target - n' }] },
            { indent: 2, tokens: [{ t: 'keyword', v: 'if' }, { t: 'plain', v: ' diff ' }, { t: 'keyword', v: 'in' }, { t: 'plain', v: ' seen:' }] },
            { indent: 3, tokens: [{ t: 'keyword', v: 'return' }, { t: 'plain', v: ' [seen[diff], i]' }] },
        ],
    },
    {
        label: 'Course · Binary Trees',
        file: 'binary_tree.py',
        color: '#8b5cf6',
        lines: [
            { indent: 0, tokens: [{ t: 'comment', v: '# Binary Tree — taught step by step' }] },
            { indent: 0, tokens: [{ t: 'keyword', v: 'class' }, { t: 'plain', v: ' ' }, { t: 'fn', v: 'TreeNode' }, { t: 'plain', v: ':' }] },
            { indent: 1, tokens: [{ t: 'keyword', v: 'def' }, { t: 'plain', v: ' ' }, { t: 'fn', v: '__init__' }, { t: 'plain', v: '(self, val=0):' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'self.val   = val' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'self.left  = ' }, { t: 'keyword', v: 'None' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'self.right = ' }, { t: 'keyword', v: 'None' }] },
        ],
    },
    {
        label: 'Visualize · BFS',
        file: 'bfs_visualizer.py',
        color: '#06b6d4',
        lines: [
            { indent: 0, tokens: [{ t: 'comment', v: '# BFS — watch it run step by step' }] },
            { indent: 0, tokens: [{ t: 'keyword', v: 'from' }, { t: 'plain', v: ' collections ' }, { t: 'keyword', v: 'import' }, { t: 'plain', v: ' deque' }] },
            { indent: 0, tokens: [{ t: 'keyword', v: 'def' }, { t: 'plain', v: ' ' }, { t: 'fn', v: 'bfs' }, { t: 'plain', v: '(graph, start):' }] },
            { indent: 1, tokens: [{ t: 'plain', v: 'queue, visited = ' }, { t: 'fn', v: 'deque' }, { t: 'plain', v: '([start]), {start}' }] },
            { indent: 1, tokens: [{ t: 'keyword', v: 'while' }, { t: 'plain', v: ' queue:' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'node = queue.' }, { t: 'fn', v: 'popleft' }, { t: 'plain', v: '()' }] },
            { indent: 2, tokens: [{ t: 'plain', v: 'visualize.' }, { t: 'fn', v: 'highlight' }, { t: 'plain', v: '(node)  ' }, { t: 'comment', v: '# 👁️ see it!' }] },
        ],
    },
];

function tokenColor(type) {
    switch (type) {
        case 'keyword': return '#c084fc';   // violet-400
        case 'fn': return '#67e8f9';   // cyan-300
        case 'str': return '#fcd34d';   // amber-300
        case 'comment': return '#6b7280';   // gray-500 italic
        default: return '#e2e8f0';   // slate-200
    }
}

function BackgroundFx({ variant = 'hero' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const getHostRect = () => {
            const host = canvas.parentElement;
            return host ? host.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        };

        const particleCount = variant === 'hero' ? 22 : 16;
        const lineDistance = variant === 'hero' ? 140 : 120;
        const mouseRadius = variant === 'hero' ? 150 : 120;
        const dotColor = variant === 'hero' ? '45,168,224' : '99,102,241';
        const lineColor = variant === 'hero' ? '100,160,220' : '129,140,248';

        const mouse = { x: -9999, y: -9999 };
        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const handleMouseLeave = () => {
            mouse.x = -9999;
            mouse.y = -9999;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * 500,
            vx: (Math.random() - 0.5) * 0.24,
            vy: (Math.random() - 0.5) * 0.24,
            baseRadius: Math.random() * 1.0 + 0.45,
            baseOpacity: Math.random() * 0.2 + 0.06,
            phase: Math.random() * Math.PI * 2,
        }));

        let frame = 0;
        let frameCount = 0;
        let lastTime = performance.now();
        let paused = false;
        let width = 0;
        let height = 0;

        const handleVisibility = () => {
            paused = document.hidden;
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const resize = () => {
            const rect = getHostRect();
            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            for (const p of particles) {
                p.x = Math.min(Math.max(p.x, -20), width + 20);
                p.y = Math.min(Math.max(p.y, -20), height + 20);
            }
        };

        const draw = (time) => {
            frame = requestAnimationFrame(draw);
            if (paused) return;

            const dt = Math.min((time - lastTime) / 16.666, 3);
            lastTime = time;
            frameCount += 1;

            const rect = getHostRect();
            const mouseX = mouse.x - rect.left;
            const mouseY = mouse.y - rect.top;

            context.clearRect(0, 0, width, height);

            for (const p of particles) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const distToMouse = Math.hypot(dx, dy);

                if (distToMouse < mouseRadius && distToMouse > 0) {
                    const force = (mouseRadius - distToMouse) / mouseRadius;
                    p.x += (dx / distToMouse) * force * 2.2 * dt;
                    p.y += (dy / distToMouse) * force * 2.2 * dt;
                }

                p.x += p.vx * dt;
                p.y += p.vy * dt;

                if (p.x < -20) p.x = width + 20;
                if (p.x > width + 20) p.x = -20;
                if (p.y < -20) p.y = height + 20;
                if (p.y > height + 20) p.y = -20;

                const pulse = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
                const radius = p.baseRadius * (0.8 + pulse * 0.4);
                const opacity = p.baseOpacity * (0.6 + pulse * 0.4);

                context.beginPath();
                context.arc(p.x, p.y, radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${dotColor},${opacity})`;
                context.fill();
            }

            context.beginPath();
            context.lineWidth = variant === 'hero' ? 0.55 : 0.5;
            context.strokeStyle = variant === 'hero' ? `rgba(${lineColor},0.12)` : `rgba(${lineColor},0.1)`;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    if (dx * dx + dy * dy < lineDistance * lineDistance) {
                        context.moveTo(particles[i].x, particles[i].y);
                        context.lineTo(particles[j].x, particles[j].y);
                    }
                }
            }
            context.stroke();
        };

        resize();
        frame = requestAnimationFrame(draw);

        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [variant]);

    const orbPalette = variant === 'hero'
        ? [
            'radial-gradient(circle, rgba(56,189,248,0.26), rgba(56,189,248,0))',
            'radial-gradient(circle, rgba(99,102,241,0.2), rgba(99,102,241,0))',
            'radial-gradient(circle, rgba(168,85,247,0.16), rgba(168,85,247,0))',
        ]
        : [
            'radial-gradient(circle, rgba(59,130,246,0.18), rgba(59,130,246,0))',
            'radial-gradient(circle, rgba(99,102,241,0.16), rgba(99,102,241,0))',
            'radial-gradient(circle, rgba(139,92,246,0.12), rgba(139,92,246,0))',
        ];

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: variant === 'hero' ? 0.5 : 0.42 }}
            />

            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div
                    className="absolute -top-16 -left-20 w-72 h-72 rounded-full blur-[80px]"
                    style={{ background: orbPalette[0], animation: 'float 8s ease-in-out infinite' }}
                />
                <div
                    className="absolute top-1/4 -right-20 w-80 h-80 rounded-full blur-[90px]"
                    style={{ background: orbPalette[1], animation: 'float 10s ease-in-out infinite' }}
                />
                <div
                    className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-[90px]"
                    style={{ background: orbPalette[2], animation: 'float 9s ease-in-out infinite' }}
                />
            </div>

            <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                    backgroundImage: 'linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)',
                    backgroundSize: '38px 38px',
                    maskImage: 'radial-gradient(circle at center, black 25%, transparent 100%)',
                    opacity: variant === 'hero' ? 0.24 : 0.18,
                }}
            />
        </>
    );
}

// Two Sum Live Visualization
function TwoSumViz({ step, color }) {
    const arr = [2, 7, 11, 15];
    const target = 9;
    const scanning = step >= 4 ? Math.min(step - 3, arr.length) : 0;
    const found = step >= 7;
    const hashMap = [];
    for (let i = 0; i < Math.min(scanning, arr.length); i++) {
        if (!found || i < 1) hashMap.push({ k: arr[i], v: i });
    }

    return (
        <div className="flex flex-col gap-3">
            <style>{`
                @keyframes vizSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes vizPopIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
                @keyframes vizGlowPulse { 0%, 100% { box-shadow: 0 0 8px var(--glow-color); } 50% { box-shadow: 0 0 24px var(--glow-color); } }
                @keyframes vizScanLine { 0% { left: -2px; opacity: 0; } 20% { opacity: 1; } 100% { left: calc(100% + 2px); opacity: 0; } }
                @keyframes vizCheckPop { 0% { transform: scale(0) rotate(-180deg); } 60% { transform: scale(1.3) rotate(10deg); } 100% { transform: scale(1) rotate(0deg); } }
                @keyframes vizHashSlide { from { opacity: 0; transform: translateX(-8px) scale(0.8); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes vizResultReveal { from { opacity: 0; transform: scaleX(0.3); } to { opacity: 1; transform: scaleX(1); } }
                @keyframes vizBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            `}</style>
            {/* Array */}
            <div className="flex items-center gap-1.5" style={{ animation: step >= 1 ? 'vizSlideUp 0.4s ease-out forwards' : 'none', opacity: step >= 1 ? 1 : 0 }}>
                <span className="text-[10px] text-neutral-500 font-mono w-12">arr =</span>
                <div className="flex gap-1 relative">
                    {/* Scanning pointer */}
                    {scanning > 0 && scanning <= arr.length && !found && (
                        <div className="absolute -top-4 transition-all duration-500 ease-out flex flex-col items-center"
                            style={{ left: `${(scanning - 1) * 44 + 16}px` }}>
                            <span className="text-[8px] font-bold" style={{ color }}>i={scanning - 1}</span>
                            <span style={{ color, fontSize: 8 }}>▼</span>
                        </div>
                    )}
                    {arr.map((n, i) => {
                        const isActive = i < scanning;
                        const isMatch = found && (i === 0 || i === 1);
                        return (
                            <div key={i} className="relative flex flex-col items-center"
                                style={{ animation: `vizPopIn 0.3s ease-out ${i * 80}ms both` }}>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border"
                                    style={{
                                        background: isMatch ? `${color}30` : isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                        borderColor: isMatch ? color : isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                                        color: isMatch ? '#fff' : isActive ? '#e2e8f0' : '#4b5563',
                                        '--glow-color': `${color}50`,
                                        animation: isMatch ? 'vizGlowPulse 1.5s ease-in-out infinite' : 'none',
                                        transform: isMatch ? 'scale(1.15)' : isActive ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                >
                                    {n}
                                </div>
                                <span className="text-[8px] text-neutral-600 mt-0.5 font-mono">[{i}]</span>
                                {isMatch && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white"
                                        style={{ background: '#22c55e', animation: 'vizCheckPop 0.5s ease-out forwards', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }}>✓</div>
                                )}
                            </div>
                        );
                    })}
                    <div className="flex items-center ml-2 px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f59e0b', animation: 'vizBounce 2s ease-in-out infinite' }}>
                        target={target}
                    </div>
                </div>
            </div>

            {/* Hash Map */}
            <div className="flex items-start gap-1.5" style={{ animation: step >= 3 ? 'vizSlideUp 0.4s ease-out forwards' : 'none', opacity: step >= 3 ? 1 : 0 }}>
                <span className="text-[10px] text-neutral-500 font-mono w-12 pt-1">seen =</span>
                <div className="flex-1 rounded-lg px-3 py-2 min-h-[32px] transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {hashMap.length === 0
                        ? <span className="text-[10px] text-neutral-600 font-mono">{'{}'}</span>
                        : <div className="flex gap-2 flex-wrap">
                            {hashMap.map(({ k, v }, i) => (
                                <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                    style={{ background: `${color}15`, color: '#e2e8f0', animation: `vizHashSlide 0.35s ease-out ${i * 120}ms both`, boxShadow: `0 0 6px ${color}20` }}>
                                    {k}→{v}
                                </span>
                            ))}
                        </div>
                    }
                </div>
            </div>

            {/* Result */}
            {found && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg origin-left"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', animation: 'vizResultReveal 0.5s ease-out forwards', boxShadow: '0 0 20px rgba(34,197,94,0.15)' }}>
                    <span className="text-xs" style={{ animation: 'vizBounce 1s ease-in-out infinite' }}>✅</span>
                    <span className="text-[11px] font-bold text-green-400 font-mono">return [0, 1]</span>
                    <span className="text-[9px] text-green-400/60 ml-auto">nums[0]+nums[1] = 9</span>
                </div>
            )}
        </div>
    );
}

// Binary Tree Live Visualization
function TreeViz({ step, color }) {
    const nodes = [
        { id: 'root', val: 10, x: 130, y: 18 },
        { id: 'left', val: 5, x: 65, y: 62 },
        { id: 'right', val: 15, x: 195, y: 62 },
    ];
    const edges = [['root', 'left'], ['root', 'right']];
    const visibleNodes = step >= 4 ? (step >= 5 ? (step >= 6 ? 3 : 2) : 1) : 0;

    return (
        <div className="flex flex-col items-center gap-2">
            <style>{`
                @keyframes treeNodeDrop { from { opacity: 0; transform: translateY(-18px) scale(0.4); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes treeEdgeGrow { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
                @keyframes treeNodeGlow { 0%, 100% { filter: drop-shadow(0 0 6px var(--node-glow)); } 50% { filter: drop-shadow(0 0 16px var(--node-glow)); } }
                @keyframes treeLabelFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes treeBadgeSlide { from { opacity: 0; transform: translateY(4px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
            <svg viewBox="0 0 260 95" className="w-full" style={{ maxHeight: 95 }}>
                {/* Edges - animated draw */}
                {edges.slice(0, Math.max(0, visibleNodes - 1)).map(([a, b], ei) => {
                    const nA = nodes.find(n => n.id === a);
                    const nB = nodes.find(n => n.id === b);
                    return (
                        <line key={a + b} x1={nA.x} y1={nA.y + 14} x2={nB.x} y2={nB.y - 14}
                            stroke={`${color}70`} strokeWidth={2.5} strokeDasharray="80"
                            style={{ animation: `treeEdgeGrow 0.6s ease-out ${ei * 150}ms forwards`, strokeDashoffset: 80 }} />
                    );
                })}
                {/* Nodes - animated drop */}
                {nodes.slice(0, visibleNodes).map((node, i) => (
                    <g key={node.id} style={{ '--node-glow': `${color}60`, animation: `treeNodeDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 200}ms both` }}>
                        {i === visibleNodes - 1 && (
                            <circle cx={node.x} cy={node.y} r={24} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}
                                style={{ animation: 'ping 1.5s ease-out infinite' }} />
                        )}
                        <circle cx={node.x} cy={node.y} r={16} fill={`${color}25`} stroke={color} strokeWidth={2}
                            style={{ animation: 'treeNodeGlow 2s ease-in-out infinite', filter: `drop-shadow(0 0 8px ${color}50)` }} />
                        <text x={node.x} y={node.y + 4.5} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{node.val}</text>
                    </g>
                ))}
                {/* Labels - fade in */}
                {visibleNodes >= 1 && <text x={130} y={92} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace" style={{ animation: 'treeLabelFade 0.4s ease-out forwards' }}>root</text>}
                {visibleNodes >= 2 && <text x={65} y={92} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace" style={{ animation: 'treeLabelFade 0.4s ease-out 200ms forwards', opacity: 0 }}>.left</text>}
                {visibleNodes >= 3 && <text x={195} y={92} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace" style={{ animation: 'treeLabelFade 0.4s ease-out 200ms forwards', opacity: 0 }}>.right</text>}
            </svg>
            {step >= 3 && (
                <div className="flex gap-3">
                    {nodes.slice(0, visibleNodes).map((n, i) => (
                        <span key={n.id} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}30`, animation: `treeBadgeSlide 0.3s ease-out ${i * 100}ms both` }}>
                            val={n.val}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// BFS Live Visualization
function BFSViz({ step, color }) {
    const gNodes = [
        { id: 'A', x: 40, y: 40 }, { id: 'B', x: 110, y: 15 },
        { id: 'C', x: 110, y: 65 }, { id: 'D', x: 180, y: 40 },
    ];
    const gEdges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D']];
    const visitOrder = ['A', 'B', 'C', 'D'];
    const visited = step >= 4 ? visitOrder.slice(0, Math.min(step - 3, 4)) : [];
    const current = visited.length > 0 ? visited[visited.length - 1] : null;
    const queue = step >= 4 ? visitOrder.filter(n => !visited.includes(n)).slice(0, 2) : [];

    return (
        <div className="flex flex-col gap-2.5">
            <style>{`
                @keyframes bfsRipple { 0% { r: 14; opacity: 0.6; } 100% { r: 30; opacity: 0; } }
                @keyframes bfsNodeReveal { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
                @keyframes bfsEdgeFlow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
                @keyframes bfsBadgePop { from { opacity: 0; transform: scale(0.5) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes bfsQueueSlide { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes bfsNodeBreathe { 0%, 100% { filter: drop-shadow(0 0 4px var(--breathe-color)); transform: scale(1); } 50% { filter: drop-shadow(0 0 14px var(--breathe-color)); transform: scale(1.08); } }
            `}</style>
            <svg viewBox="0 0 220 80" className="w-full" style={{ maxHeight: 80 }}>
                {/* Edges with animated flow */}
                {gEdges.map(([a, b]) => {
                    const nA = gNodes.find(n => n.id === a);
                    const nB = gNodes.find(n => n.id === b);
                    const active = visited.includes(a) && visited.includes(b);
                    return (
                        <line key={a + b} x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                            stroke={active ? `${color}80` : 'rgba(255,255,255,0.08)'} strokeWidth={active ? 2.5 : 1.5}
                            strokeDasharray={active ? '100' : 'none'}
                            style={{ animation: active ? 'bfsEdgeFlow 0.6s ease-out forwards' : 'none', transition: 'stroke 0.4s' }} />
                    );
                })}
                {/* Nodes with ripples & breathing */}
                {gNodes.map(({ id, x, y }) => {
                    const isVisited = visited.includes(id);
                    const isCurrent = id === current;
                    const isQueued = queue.includes(id);
                    const fill = isCurrent ? color : isVisited ? '#22c55e' : isQueued ? '#8b5cf680' : 'rgba(255,255,255,0.06)';
                    return (
                        <g key={id} style={{ '--breathe-color': fill }}>
                            {/* Ripple rings on current */}
                            {isCurrent && (
                                <>
                                    <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}
                                        style={{ animation: 'bfsRipple 1.2s ease-out infinite' }} />
                                    <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={1} opacity={0.4}
                                        style={{ animation: 'bfsRipple 1.2s ease-out 0.4s infinite' }} />
                                </>
                            )}
                            <circle cx={x} cy={y} r={14} fill={fill}
                                stroke={isCurrent ? color : isVisited ? '#22c55e' : isQueued ? '#8b5cf6' : 'rgba(255,255,255,0.12)'} strokeWidth={2}
                                style={{
                                    animation: (isCurrent || isVisited) ? 'bfsNodeBreathe 2s ease-in-out infinite' : 'none',
                                    transition: 'fill 0.4s, stroke 0.4s',
                                    transformOrigin: `${x}px ${y}px`,
                                }} />
                            <text x={x} y={y + 4} textAnchor="middle" fill={isVisited || isCurrent || isQueued ? '#fff' : '#6b7280'} fontSize="11" fontWeight="800"
                                style={{ transition: 'fill 0.3s' }}>{id}</text>
                        </g>
                    );
                })}
            </svg>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-neutral-500 font-mono">visited:</span>
                    <div className="flex gap-1">{visited.map((v, vi) => (
                        <span key={v} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', animation: `bfsBadgePop 0.3s ease-out ${vi * 80}ms both` }}>{v}</span>
                    ))}</div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-neutral-500 font-mono">queue:</span>
                    <div className="flex gap-1">{queue.length === 0
                        ? <span className="text-[9px] text-neutral-600 italic">∅</span>
                        : queue.map((q, qi) => (
                            <span key={q} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${color}20`, color, animation: `bfsQueueSlide 0.25s ease-out ${qi * 60}ms both` }}>{q}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Snippet Visualizer Picker
function SnippetViz({ snippetIdx, step, color }) {
    if (snippetIdx === 0) return <TwoSumViz step={step} color={color} />;
    if (snippetIdx === 1) return <TreeViz step={step} color={color} />;
    return <BFSViz step={step} color={color} />;
}

function TypingTerminal() {
    const [snippetIdx, setSnippetIdx] = useState(0);
    const [visibleLines, setVisibleLines] = useState(0);
    const [phase, setPhase] = useState('typing'); // 'typing' | 'done'
    const timerRef = useRef(null);

    const snippet = CODE_SNIPPETS[snippetIdx];

    useEffect(() => {
        setVisibleLines(0);
        setPhase('typing');
    }, [snippetIdx]);

    useEffect(() => {
        clearTimeout(timerRef.current);
        if (phase === 'typing' && visibleLines < snippet.lines.length) {
            timerRef.current = setTimeout(() => setVisibleLines(v => v + 1), 220);
        } else if (phase === 'typing' && visibleLines >= snippet.lines.length) {
            setPhase('done');
        }
        return () => clearTimeout(timerRef.current);
    }, [phase, visibleLines, snippet.lines.length]);

    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-2xl border skew-y-1 hover:skew-y-0 transition-all duration-700"
            style={{
                background: '#0d0d0d',
                borderColor: `${snippet.color}40`,
                boxShadow: `0 0 60px ${snippet.color}22, 0 25px 50px rgba(0,0,0,0.5)`,
            }}
        >
            <style>{`
                @keyframes codeLineSlide { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes lineNumFade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes glowOrbPulse { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.55; transform: scale(1.1); } }
                @keyframes outputPanelReveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shimmerLine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            `}</style>

            {/* Glow orb */}
            <div style={{
                position: 'absolute', top: -60, right: -60, width: 180, height: 180,
                borderRadius: '50%', background: `radial-gradient(circle, ${snippet.color}55, transparent 70%)`,
                filter: 'blur(40px)', pointerEvents: 'none',
                animation: 'glowOrbPulse 3s ease-in-out infinite',
            }} />

            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${snippet.color}25`, background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: snippet.color }} />
                    <span className="font-mono text-xs" style={{ color: snippet.color }}>{snippet.file}</span>
                </div>
                <div className="flex gap-1.5">
                    {CODE_SNIPPETS.map((s, i) => (
                        <button key={i} onClick={() => setSnippetIdx(i)}
                            className="rounded-full transition-all duration-300 cursor-pointer hover:scale-150"
                            style={{ width: i === snippetIdx ? 18 : 7, height: 7, background: i === snippetIdx ? s.color : '#374151' }} />
                    ))}
                </div>
            </div>

            {/* Code body */}
            <div className="p-5 font-mono text-sm leading-7 min-h-[200px]">
                {snippet.lines.slice(0, visibleLines).map((line, li) => (
                    <div key={li} className="flex" style={{ paddingLeft: `${line.indent * 1.5}rem`, animation: `codeLineSlide 0.3s ease-out ${li * 40}ms both` }}>
                        <span className="text-neutral-600 select-none mr-4 text-xs" style={{ minWidth: '1.5rem', animation: `lineNumFade 0.2s ease-out ${li * 40}ms both` }}>{li + 1}</span>
                        <span>
                            {line.tokens.length === 0 ? '\u00A0' : line.tokens.map((tok, ti) => (
                                <span
                                    key={ti}
                                    style={{
                                        color: tokenColor(tok.type !== undefined ? tok.type : tok.t),
                                        fontStyle: tok.t === 'comment' ? 'italic' : 'normal',
                                    }}
                                >{tok.v}</span>
                            ))}
                            {li === visibleLines - 1 && phase === 'typing' && (
                                <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-middle rounded-sm" style={{ background: snippet.color, animation: 'cursorBlink 0.8s step-end infinite', boxShadow: `0 0 6px ${snippet.color}` }} />
                            )}
                        </span>
                    </div>
                ))}
            </div>

            {/* Live Output Panel */}
            <div className="border-t px-5 py-4" style={{ borderColor: `${snippet.color}20`, background: 'rgba(255,255,255,0.015)', animation: visibleLines > 0 ? 'outputPanelReveal 0.4s ease-out forwards' : 'none' }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: visibleLines > 0 ? '#22c55e' : '#6b7280', animation: visibleLines > 0 ? 'vizBounce 1.5s ease-in-out infinite' : 'none' }} />
                    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: visibleLines > 0 ? '#22c55e' : '#6b7280' }}>
                        {phase === 'typing' ? 'Running...' : phase === 'done' ? 'Live Output' : 'Waiting...'}
                    </span>
                    <div className="flex-1 h-px relative overflow-hidden" style={{ background: `${snippet.color}15` }}>
                        {phase === 'typing' && (
                            <div className="absolute inset-0" style={{
                                background: `linear-gradient(90deg, transparent, ${snippet.color}40, transparent)`,
                                backgroundSize: '200% 100%',
                                animation: 'shimmerLine 1.5s linear infinite',
                            }} />
                        )}
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: `${snippet.color}60` }}>▸ run</span>
                </div>
                <SnippetViz snippetIdx={snippetIdx} step={visibleLines} color={snippet.color} />
            </div>

            {/* Topic badge */}
            <div className="px-5 pb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${snippet.color}20`, color: snippet.color, border: `1px solid ${snippet.color}40` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: snippet.color }} />
                    {snippet.label}
                </span>
                <span className="text-xs text-neutral-600 font-mono">marevlo.ai</span>
            </div>
        </div>
    );
}

// Animated Stat Counter
function StatCounter({ end, suffix, label, color }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                let start = 0;
                const duration = 1800;
                const step = Math.ceil(end / (duration / 16));
                const timer = setInterval(() => {
                    start = Math.min(start + step, end);
                    setCount(start);
                    if (start >= end) clearInterval(timer);
                }, 16);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);

    return (
        <div ref={ref} className="flex flex-col items-center gap-1 px-6 py-4 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
            <span className="text-3xl font-extrabold tracking-tighter" style={{ color }}>
                {count.toLocaleString()}{suffix}
            </span>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{label}</span>
        </div>
    );
}

// BFS Visualizer Component
const BFS_NODES = [
    { id: 'A', x: 60, y: 75 },
    { id: 'B', x: 155, y: 30 },
    { id: 'C', x: 155, y: 120 },
    { id: 'D', x: 248, y: 55 },
    { id: 'E', x: 248, y: 100 },
];
const BFS_EDGES = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E']];
const BFS_STEPS = [
    { current: null, visited: [], queue: ['A'], label: 'Start — enqueue A' },
    { current: 'A', visited: ['A'], queue: ['B', 'C'], label: 'Visit A → enqueue B, C' },
    { current: 'B', visited: ['A', 'B'], queue: ['C', 'D', 'E'], label: 'Visit B → enqueue D, E' },
    { current: 'C', visited: ['A', 'B', 'C'], queue: ['D', 'E'], label: 'Visit C → E already queued' },
    { current: 'D', visited: ['A', 'B', 'C', 'D'], queue: ['E'], label: 'Visit D — no new neighbours' },
    { current: 'E', visited: ['A', 'B', 'C', 'D', 'E'], queue: [], label: '✅ BFS complete! All visited' },
];

function BFSVisualizer({ isDark = false }) {
    const [step, setStep] = useState(0);
    const [paused, setPaused] = useState(false);

    const cur = BFS_STEPS[step];

    // Infinite loop: advances every 1.1s, wraps with %
    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => {
            setStep(s => (s + 1) % BFS_STEPS.length);
        }, 1100);
        return () => clearInterval(id);
    }, [paused]);

    const nodeState = (id) => {
        if (cur.current === id) return 'current';
        if (cur.visited.includes(id)) return 'visited';
        if (cur.queue.includes(id)) return 'queued';
        return 'idle';
    };
    const nodeColor = { current: '#06b6d4', visited: '#22c55e', queued: '#8b5cf6', idle: 'rgba(255,255,255,0.10)' };
    const nodeBorder = { current: '#06b6d4', visited: '#22c55e', queued: '#8b5cf6', idle: 'rgba(255,255,255,0.15)' };
    const nodeText = { current: '#fff', visited: '#fff', queued: '#fff', idle: 'rgba(255,255,255,0.35)' };

    return (
        <div className="lg:col-span-5 rounded-3xl border overflow-hidden relative"
            style={{
                background: isDark ? '#0d0d0d' : 'linear-gradient(145deg, #17223a, #222f4f)',
                borderColor: isDark ? 'rgba(6,182,212,0.35)' : 'rgba(59,130,246,0.28)'
            }}>
            <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-[60px] opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #06b6d4, #8b5cf6)' }} />
            <div className="p-6 relative z-10">

                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)' }}>👁️</div>
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#06b6d4' }}>Live Visualization</span>
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: paused ? '#f59e0b' : '#06b6d4' }} />
                        <span className="text-[10px] font-semibold" style={{ color: paused ? '#f59e0b' : '#06b6d4' }}>
                            {paused ? 'paused' : 'live'}
                        </span>
                    </div>
                </div>

                {/* Title + step */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <span className="text-sm font-extrabold text-white">BFS — Graph Traversal</span>
                        <span className="text-xs text-neutral-500 ml-2">Step {step + 1} / {BFS_STEPS.length}</span>
                    </div>
                </div>

                {/* Step description */}
                <div className="px-3 py-2 rounded-xl mb-3 text-xs font-semibold transition-all duration-300"
                    style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9' }}>
                    {cur.label}
                </div>

                {/* Graph SVG */}
                <div className="relative rounded-2xl overflow-hidden mb-3"
                    style={{ background: '#0d0d0d', border: '1px solid rgba(6,182,212,0.15)', height: 158 }}>
                    <svg viewBox="0 0 310 158" className="w-full h-full">
                        {/* Edges */}
                        {BFS_EDGES.map(([a, b]) => {
                            const nA = BFS_NODES.find(n => n.id === a);
                            const nB = BFS_NODES.find(n => n.id === b);
                            const active = nodeState(a) !== 'idle' && nodeState(b) !== 'idle';
                            return (
                                <line key={a + b}
                                    x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                                    stroke={active ? 'rgba(6,182,212,0.55)' : 'rgba(255,255,255,0.07)'}
                                    strokeWidth={active ? 2 : 1.5}
                                    style={{ transition: 'stroke 0.5s' }}
                                />
                            );
                        })}
                        {/* Nodes */}
                        {BFS_NODES.map(({ id, x, y }) => {
                            const st = nodeState(id);
                            const c = nodeColor[st];
                            return (
                                <g key={id}>
                                    {/* pulse ring on current */}
                                    {st === 'current' && (
                                        <circle cx={x} cy={y} r={26} fill="none"
                                            stroke="#06b6d4" strokeWidth="1.5" opacity="0.3"
                                            style={{ animation: 'ping 1s ease-out infinite' }} />
                                    )}
                                    <circle cx={x} cy={y} r={19} fill={c}
                                        stroke={nodeBorder[st]} strokeWidth={st === 'current' ? 3 : 2}
                                        style={{
                                            filter: st !== 'idle' ? `drop-shadow(0 0 10px ${c})` : 'none',
                                            transition: 'fill 0.5s, filter 0.5s'
                                        }}
                                    />
                                    <text x={x} y={y + 5} textAnchor="middle"
                                        fill={nodeText[st]} fontSize="13" fontWeight="800"
                                        style={{ transition: 'fill 0.5s' }}>
                                        {id}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Continuous progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full"
                            style={{
                                width: `${((step) / (BFS_STEPS.length - 1)) * 100}%`,
                                background: 'linear-gradient(90deg,#6366f1,#06b6d4)',
                                transition: 'width 0.5s ease'
                            }} />
                    </div>
                </div>

                {/* Queue display */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366f150' }}>Queue:</span>
                    <div className="flex gap-1.5 flex-wrap flex-1">
                        {cur.queue.length === 0
                            ? <span className="text-[10px] text-neutral-600 italic">empty</span>
                            : cur.queue.map((q, i) => (
                                <span key={q + i} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    {q}
                                </span>
                            ))}
                    </div>
                    {/* Legend */}
                    <div className="flex gap-2 flex-shrink-0">
                        {[['Visited', '#22c55e'], ['Current', '#06b6d4'], ['Queued', '#8b5cf6']].map(([l, c]) => (
                            <div key={l} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                                <span className="text-[9px] text-neutral-600">{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls: just prev / pause-play / next + step dots */}
                <div className="flex items-center gap-2">
                    <button onClick={() => { setPaused(true); setStep(s => Math.max(0, s - 1)); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>◀</button>

                    <button onClick={() => setPaused(p => !p)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', boxShadow: '0 0 14px rgba(6,182,212,0.35)' }}>
                        {paused ? '▶ Play' : '⏸ Pause'}
                    </button>

                    <button onClick={() => { setPaused(true); setStep(s => Math.min(BFS_STEPS.length - 1, s + 1)); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>▶</button>

                    {/* Step dots */}
                    <div className="ml-auto flex gap-1.5 items-center">
                        {BFS_STEPS.map((_, i) => (
                            <button key={i}
                                onClick={() => { setPaused(true); setStep(i); }}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === step ? 18 : 6,
                                    height: 6,
                                    background: i === step ? '#06b6d4' : i < step ? '#22c55e55' : 'rgba(255,255,255,0.12)'
                                }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Personalized AI Tutor Component
const AI_LEVELS = [
    {
        id: 'beg',
        label: 'Beginner',
        query: 'Why does my loop run forever?',
        standard: 'Your while loop condition never becomes false. Make sure to increment the counter.',
        premium: 'Think of it like a treadmill that never stops! 🏃‍♂️\n\nYou are missing an update step:\n`count += 1`\n\nWant to try adding it?'
    },
    {
        id: 'int',
        label: 'Intermediate',
        query: 'How to optimize this nested loop?',
        standard: 'You can reduce O(n²) to O(n) by using a Hash Map for O(1) lookups.',
        premium: 'Great question! Nested loops are `O(n²)`. By trading space for time, we can use a **Hash Map**.\n\nImagine looking up a word in an index instead of reading the whole book. Want a hint?'
    },
    {
        id: 'adv',
        label: 'Advanced',
        query: 'When to use BFS over DFS?',
        standard: 'BFS uses more memory for wide trees, but guarantees shortest path in unweighted graphs.',
        premium: 'BFS guarantees the **shortest path**, but takes `O(V)` space for wide graphs.\n\nDFS is more memory-efficient `O(h)`. What specific graph structure are you dealing with?'
    }
];

function AITutorCard({ isDark = false }) {
    const [levelIdx, setLevelIdx] = useState(0);
    const [isPremium, setIsPremium] = useState(true);
    const [isThinking, setIsThinking] = useState(false);

    // auto cycle levels with thinking phase
    useEffect(() => {
        const id = setInterval(() => {
            setLevelIdx(l => (l + 1) % AI_LEVELS.length);
            setIsThinking(true);
            setTimeout(() => {
                setIsThinking(false);
            }, 1000); // 1 second thinking gap
        }, 4500);
        return () => clearInterval(id);
    }, []);

    const cur = AI_LEVELS[levelIdx];

    return (
        <div className="lg:col-span-3 rounded-3xl border overflow-hidden relative transition-all duration-500"
            style={{
                background: isDark ? '#0d0d0d' : 'linear-gradient(145deg, #1a2440, #253255)',
                borderColor: isPremium ? 'rgba(139,92,246,0.35)' : 'rgba(6,182,212,0.3)'
            }}>
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounceDot {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-3px); opacity: 1; }
                }
                @keyframes pulseRingPrem {
                    0% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
                    70% { box-shadow: 0 0 0 10px rgba(139,92,246,0); }
                    100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); }
                }
                @keyframes pulseRingStd {
                    0% { box-shadow: 0 0 0 0 rgba(6,182,212,0.5); }
                    70% { box-shadow: 0 0 0 10px rgba(6,182,212,0); }
                    100% { box-shadow: 0 0 0 0 rgba(6,182,212,0); }
                }
            `}</style>

            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-700 delay-100"
                style={{ background: isPremium ? 'radial-gradient(circle, #8b5cf6, #ec4899)' : 'radial-gradient(circle, #06b6d4, #3b82f6)', transform: isThinking ? 'scale(1.2)' : 'scale(1)' }} />

            <div className="p-5 relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-500 relative"
                        style={{
                            background: isPremium ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.15)',
                            border: `1px solid ${isPremium ? 'rgba(139,92,246,0.35)' : 'rgba(6,182,212,0.35)'}`,
                            animation: isThinking ? (isPremium ? 'pulseRingPrem 1.5s infinite' : 'pulseRingStd 1.5s infinite') : 'none'
                        }}>
                        {isPremium ? '✨' : '🤖'}
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase transition-colors duration-500"
                        style={{ color: isPremium ? '#a78bfa' : '#06b6d4' }}>
                        {isPremium ? 'Premium AI' : 'Standard AI'}
                    </span>

                    {/* Mode Toggle */}
                    <button
                        onClick={() => { setIsPremium(!isPremium); setIsThinking(true); setTimeout(() => setIsThinking(false), 800); }}
                        className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95">
                        {isPremium ? 'Standard ⚡' : 'Premium ✨'}
                    </button>
                </div>

                {/* Chat area min-h to fit responses without jumping */}
                <div className="flex-1 space-y-3 mb-3 relative min-h-[145px]">
                    {/* User Message - Always visible after level change */}
                    <div key={cur.id + "user"} className="flex justify-end" style={{ animation: 'slideUpFade 0.3s ease-out forwards' }}>
                        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] text-white max-w-[85%] font-medium">
                            {cur.query}
                        </div>
                    </div>

                    {/* AI Response or Thinking */}
                    <div className="flex justify-start">
                        {isThinking ? (
                            <div key="thinking" className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1"
                                style={{
                                    background: isPremium ? 'rgba(139,92,246,0.1)' : 'rgba(6,182,212,0.05)',
                                    border: `1px solid ${isPremium ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.15)'}`
                                }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isPremium ? '#a78bfa' : '#67e8f9', animation: 'bounceDot 1s infinite' }} />
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isPremium ? '#a78bfa' : '#67e8f9', animation: 'bounceDot 1s infinite 0.2s' }} />
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isPremium ? '#a78bfa' : '#67e8f9', animation: 'bounceDot 1s infinite 0.4s' }} />
                            </div>
                        ) : (
                            <div key={cur.id + isPremium + "resp"} className="rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[95%] leading-relaxed"
                                style={{
                                    animation: 'slideUpFade 0.4s ease-out forwards',
                                    background: isPremium ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.1)',
                                    border: `1px solid ${isPremium ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.25)'}`,
                                    color: isPremium ? '#fff' : '#e2e8f0',
                                    boxShadow: isPremium ? '0 4px 20px rgba(139,92,246,0.15)' : 'none'
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: (isPremium ? cur.premium : cur.standard)
                                        .replace(/`([^`]+)`/g, `<span style="color:${isPremium ? '#f472b6' : '#67e8f9'}; background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; font-family:monospace; font-size:10px">$1</span>`)
                                        .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${isPremium ? '#a78bfa' : 'white'}">$1</strong>`)
                                        .replace(/\n/g, '<br/>')
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-auto transition-colors duration-500"
                    style={{ background: isThinking ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-[11px] text-neutral-500 flex-1">{isThinking ? 'AI is typing...' : 'Ask anything...'}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ background: isPremium ? '#8b5cf6' : '#06b6d4', transform: isThinking ? 'scale(0.8)' : 'scale(1)' }}>
                        <ArrowUpRight size={10} className="text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Approaches Card
const APPROACHES = [
    {
        name: 'Brute Force',
        emoji: '🔨',
        tag: 'Simple',
        tagIcon: '○',
        time: 'O(n²)',
        timeBar: 22,
        space: 'O(1)',
        spaceBar: 95,
        timeRating: 'Slow',
        spaceRating: 'Minimal',
        desc: 'Try every pair of numbers. Simple to write but slow — checks all combinations until a match is found.',
        when: 'Use as a baseline only. Always try to beat this.',
        code: [
            [{ t: 'keyword', v: 'for' }, { t: 'plain', v: ' i ' }, { t: 'keyword', v: 'in' }, { t: 'plain', v: ' range(len(nums)):' }],
            [{ t: 'keyword', v: '  for' }, { t: 'plain', v: ' j ' }, { t: 'keyword', v: 'in' }, { t: 'plain', v: ' range(i+1, len(nums)):' }],
            [{ t: 'keyword', v: '    if' }, { t: 'plain', v: ' nums[i] + nums[j] == target:' }],
            [{ t: 'keyword', v: '      return' }, { t: 'plain', v: ' [i, j]' }],
        ],
        accentFrom: '#f59e0b',
        accentTo: '#fb923c',
    },
    {
        name: 'Hash Map',
        emoji: '⚡',
        tag: 'Optimal',
        tagIcon: '★',
        time: 'O(n)',
        timeBar: 92,
        space: 'O(n)',
        spaceBar: 55,
        timeRating: 'Fast',
        spaceRating: 'Moderate',
        desc: 'Store each number in a hash map while scanning. For every new element, instantly check if the complement exists.',
        when: 'The go-to interview answer for unsorted arrays.',
        code: [
            [{ t: 'plain', v: 'seen = {}' }],
            [{ t: 'keyword', v: 'for' }, { t: 'plain', v: ' i, n ' }, { t: 'keyword', v: 'in' }, { t: 'fn', v: 'enumerate' }, { t: 'plain', v: '(nums):' }],
            [{ t: 'plain', v: '  diff = target - n' }],
            [{ t: 'keyword', v: '  if' }, { t: 'plain', v: ' diff ' }, { t: 'keyword', v: 'in' }, { t: 'plain', v: ' seen:' }],
            [{ t: 'keyword', v: '    return' }, { t: 'plain', v: ' [seen[diff], i]' }],
        ],
        accentFrom: '#6366f1',
        accentTo: '#8b5cf6',
    },
    {
        name: 'Two Pointers',
        emoji: '🎯',
        tag: 'Sorted',
        tagIcon: '◈',
        time: 'O(n log n)',
        timeBar: 68,
        space: 'O(1)',
        spaceBar: 95,
        timeRating: 'Moderate',
        spaceRating: 'Minimal',
        desc: 'Sort first, then shrink the window with left & right pointers. Elegant and space-efficient.',
        when: 'Ideal when input is pre-sorted or memory is tight.',
        code: [
            [{ t: 'plain', v: 'nums.sort()' }],
            [{ t: 'plain', v: 'l, r = 0, len(nums) - 1' }],
            [{ t: 'keyword', v: 'while' }, { t: 'plain', v: ' l < r:' }],
            [{ t: 'plain', v: '  s = nums[l] + nums[r]' }],
            [{ t: 'keyword', v: '  if' }, { t: 'plain', v: ' s == target: ' }, { t: 'keyword', v: 'return' }, { t: 'plain', v: ' [l,r]' }],
        ],
        accentFrom: '#06b6d4',
        accentTo: '#3b82f6',
    },
];

function ApproachesCard({ isDark = false }) {
    const [activeIdx, setActiveIdx] = useState(1);
    const [animKey, setAnimKey] = useState(0);
    const ap = APPROACHES[activeIdx];

    useEffect(() => {
        const id = setInterval(() => {
            setActiveIdx(i => (i + 1) % APPROACHES.length);
            setAnimKey(k => k + 1);
        }, 4200);
        return () => clearInterval(id);
    }, []);

    const handleTab = (i) => { setActiveIdx(i); setAnimKey(k => k + 1); };

    const tokColor = (t) => ({ keyword: '#c084fc', fn: '#67e8f9', str: '#fcd34d', comment: '#4b5563', plain: '#e2e8f0' }[t] ?? '#e2e8f0');

    return (
        <div className="lg:col-span-5 rounded-3xl relative overflow-hidden"
            style={{
                background: isDark ? '#0d0d0d' : 'linear-gradient(145deg, #16213a, #1f2c49)',
                border: '1px solid rgba(255,255,255,0.07)'
            }}>

            {/* Ambient glow blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none transition-all duration-700"
                style={{ background: `radial-gradient(circle, ${ap.accentFrom}30, transparent 70%)`, filter: 'blur(40px)' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${ap.accentTo}20, transparent 70%)`, filter: 'blur(30px)' }} />

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
                style={{ background: `linear-gradient(90deg, transparent, ${ap.accentFrom}, ${ap.accentTo}, transparent)` }} />

            <div className="relative z-10 p-6">

                {/* Header */}
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>💡</div>
                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/40">Multiple Approaches</span>
                    <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ap.accentFrom }} />
                        <span className="text-[9px] font-mono text-white/30">two_sum.py</span>
                    </div>
                </div>

                {/* Question */}
                <p className="text-white/90 font-semibold text-sm mb-4">
                    How would you solve <span className="font-extrabold" style={{
                        background: `linear-gradient(135deg, ${ap.accentFrom}, ${ap.accentTo})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                    }}>Two Sum</span>?
                </p>

                {/* Tab Selector */}
                <div className="grid grid-cols-3 gap-1.5 mb-5 p-1 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {APPROACHES.map((a, i) => (
                        <button key={a.name} onClick={() => handleTab(i)}
                            className="flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative overflow-hidden"
                            style={{
                                background: i === activeIdx
                                    ? `linear-gradient(135deg, ${a.accentFrom}22, ${a.accentTo}18)`
                                    : 'transparent',
                                border: `1px solid ${i === activeIdx ? a.accentFrom + '50' : 'transparent'}`,
                                color: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.3)',
                                boxShadow: i === activeIdx ? `0 0 20px ${a.accentFrom}22, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                                transform: i === activeIdx ? 'translateY(-1px)' : 'none',
                            }}>
                            <span className="text-base leading-none">{a.emoji}</span>
                            <span className="text-[10px] leading-tight text-center">{a.name}</span>
                            {i === activeIdx && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${a.accentFrom}, ${a.accentTo})` }} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Active Card */}
                <div key={animKey} className="rounded-2xl mb-4 overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid rgba(255,255,255,0.08)`,
                        animation: 'slideUpFade 0.35s ease-out forwards'
                    }}>

                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `linear-gradient(90deg, ${ap.accentFrom}12, ${ap.accentTo}08)` }}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{ap.emoji}</span>
                            <span className="text-sm font-extrabold text-white">{ap.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: `linear-gradient(135deg, ${ap.accentFrom}25, ${ap.accentTo}20)`, color: ap.accentFrom, border: `1px solid ${ap.accentFrom}40` }}>
                            {ap.tagIcon} {ap.tag}
                        </span>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                        {/* Description */}
                        <p className="text-xs text-white/55 leading-relaxed">{ap.desc}</p>

                        {/* Complexity bars */}
                        <div className="space-y-2">
                            {[
                                { label: 'Time', val: ap.time, bar: ap.timeBar, rating: ap.timeRating },
                                { label: 'Space', val: ap.space, bar: ap.spaceBar, rating: ap.spaceRating },
                            ].map(({ label, val, bar, rating }) => (
                                <div key={label} className="flex items-center gap-3">
                                    <span className="text-[10px] font-semibold text-white/30 w-8 shrink-0">{label}</span>
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${bar}%`, background: `linear-gradient(90deg, ${ap.accentFrom}, ${ap.accentTo})` }} />
                                    </div>
                                    <code className="text-[10px] font-mono text-white/60 w-16 text-right shrink-0">{val}</code>
                                    <span className="text-[9px] font-bold w-14 shrink-0" style={{ color: ap.accentFrom }}>{rating}</span>
                                </div>
                            ))}
                        </div>

                        {/* Code block */}
                        <div className="rounded-xl overflow-hidden" style={{ background: '#060610', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                </div>
                                <span className="text-[9px] font-mono text-white/20 ml-1">{ap.name.toLowerCase().replace(' ', '_')}.py</span>
                                <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ap.accentFrom }} />
                            </div>
                            <div className="p-3 font-mono text-[11px] leading-[1.7] space-y-0.5">
                                {ap.code.map((line, li) => (
                                    <div key={li} className="flex">
                                        <span className="text-white/15 select-none mr-3 text-[9px] w-3 shrink-0">{li + 1}</span>
                                        <span>{line.map((tok, ti) => (
                                            <span key={ti} style={{ color: tokColor(tok.t) }}>{tok.v}</span>
                                        ))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* When to use */}
                <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${ap.accentFrom}10, ${ap.accentTo}08)`, border: `1px solid ${ap.accentFrom}25` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5"
                        style={{ background: ap.accentFrom + '20' }}>💬</div>
                    <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase block mb-0.5" style={{ color: ap.accentFrom }}>When to use</span>
                        <p className="text-[11px] text-white/50 leading-relaxed">{ap.when}</p>
                    </div>
                </div>

                {/* Step dots */}
                <div className="flex justify-center items-center gap-2 mt-4">
                    {APPROACHES.map((a, i) => (
                        <button key={i} onClick={() => handleTab(i)}
                            className="rounded-full cursor-pointer transition-all duration-400"
                            style={{
                                width: i === activeIdx ? 20 : 5,
                                height: 5,
                                background: i === activeIdx ? `linear-gradient(90deg, ${a.accentFrom}, ${a.accentTo})` : 'rgba(255,255,255,0.12)',
                                boxShadow: i === activeIdx ? `0 0 8px ${a.accentFrom}60` : 'none',
                            }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Ladders Card
const LADDER_LEVELS = [
    { level: 0, label: 'Basic Operation', emoji: '🧩', color: '#06b6d4', desc: 'The atomic action. e.g. "check if a key exists in a dict".' },
    { level: 1, label: 'Building Block', emoji: '⚡', color: '#8b5cf6', desc: 'Combine basic ops. e.g. "scan one pass and track a value".' },
    { level: 2, label: 'Core Logic', emoji: '💡', color: '#f59e0b', desc: 'The heart of the approach. e.g. "lookup complement and store index".' },
    { level: 3, label: 'Key Sub-routine', emoji: '🔧', color: '#10b981', desc: 'Wrap the logic into a reusable sub-function.' },
    { level: 4, label: 'Full Problem', emoji: '🎯', color: '#6366f1', desc: 'Assemble everything into the complete solution.' },
    { level: 5, label: 'Optimised Variant', emoji: '🚀', color: '#ec4899', desc: 'Handle edge cases, constraints, and further optimisations.' },
];

const LADDER_EXAMPLE = [
    { level: 0, title: 'Look up in dict', hint: 'if key in d: ...', locked: false },
    { level: 1, title: 'One-pass scan', hint: 'for i, n in enumerate(nums): ...', locked: false },
    { level: 2, title: 'Track complement', hint: 'diff = target - n; if diff in seen', locked: false },
    { level: 3, title: 'Wrap into helper fn', hint: 'def find_pair(nums, target): ...', locked: true },
    { level: 4, title: 'Full Two Sum solution', hint: 'seen = {}; for i, n in enum...', locked: true },
    { level: 5, title: 'Handle duplicates & edge', hint: 'if not nums or len < 2: return []', locked: true },
];

function LaddersCard({ isDark = false }) {
    const [activeLevel, setActiveLevel] = useState(2);
    const [unlocked, setUnlocked] = useState(3); // 0-2 unlocked (indices 0,1,2)

    // auto-cycle through unlocked levels
    useEffect(() => {
        const id = setInterval(() => {
            setActiveLevel(l => l < unlocked - 1 ? l + 1 : 0);
        }, 2200);
        return () => clearInterval(id);
    }, [unlocked]);

    const handleUnlock = () => {
        if (unlocked < LADDER_LEVELS.length) setUnlocked(u => u + 1);
    };

    const ap = LADDER_LEVELS[activeLevel];
    const ex = LADDER_EXAMPLE[activeLevel];

    return (
        <div className="lg:col-span-7 rounded-3xl relative overflow-hidden"
            style={{
                background: isDark ? '#0d0d0d' : 'linear-gradient(145deg, #151f37, #1d2a48)',
                border: '1px solid rgba(255,255,255,0.07)'
            }}>

            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-96 h-64 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${ap.color}18, transparent 65%)`, filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />
            <div className="absolute bottom-0 left-0 w-64 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, #6366f118, transparent 65%)', filter: 'blur(40px)', transform: 'translate(-20%,30%)' }} />

            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent 5%, ${ap.color}80, transparent 95%)`, transition: 'background 0.5s' }} />

            <div className="relative z-10 p-7">

                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>🪜</div>
                        <div>
                            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/35">Inside Every Approach</div>
                            <div className="text-lg font-extrabold text-white leading-tight">The Ladder System</div>
                        </div>
                    </div>
                    <p className="sm:ml-auto text-xs text-white/40 max-w-sm leading-relaxed">
                        Each approach is broken into <strong className="text-white/70">6 progressive levels</strong>. Start from the simplest building block and climb up to the full solution — unlocking one step at a time.
                    </p>
                </div>

                {/* Main layout: ladder rail left, detail right */}
                <div className="grid lg:grid-cols-12 gap-6">

                    {/* Left: Vertical Ladder Rail */}
                    <div className="lg:col-span-4">
                        <div className="relative">
                            {/* Vertical connector line */}
                            <div className="absolute left-[19px] top-5 bottom-5 w-px"
                                style={{ background: 'rgba(255,255,255,0.06)' }} />

                            <div className="space-y-2">
                                {LADDER_LEVELS.map((lvl, i) => {
                                    const isUnlocked = i < unlocked;
                                    const isActive = i === activeLevel;
                                    const isNext = i === unlocked;
                                    return (
                                        <button key={i}
                                            onClick={() => isUnlocked && setActiveLevel(i)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-300 relative"
                                            style={{
                                                background: isActive ? `linear-gradient(90deg, ${lvl.color}18, transparent)` : 'transparent',
                                                border: `1px solid ${isActive ? lvl.color + '40' : 'transparent'}`,
                                                cursor: isUnlocked ? 'pointer' : 'default',
                                                opacity: !isUnlocked && !isNext ? 0.35 : 1,
                                            }}>
                                            {/* Node circle */}
                                            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold relative z-10"
                                                style={{
                                                    background: isActive ? lvl.color : isUnlocked ? lvl.color + '25' : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${isActive ? lvl.color : isUnlocked ? lvl.color + '60' : 'rgba(255,255,255,0.1)'}`,
                                                    color: isActive ? '#fff' : isUnlocked ? lvl.color : 'rgba(255,255,255,0.2)',
                                                    boxShadow: isActive ? `0 0 16px ${lvl.color}60` : 'none',
                                                    transition: 'all 0.35s',
                                                }}>
                                                {isUnlocked ? lvl.emoji : '🔒'}
                                            </div>
                                            {/* Label */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isUnlocked ? lvl.color : 'rgba(255,255,255,0.2)' }}>L{lvl.level}</span>
                                                    {isNext && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>Next</span>}
                                                </div>
                                                <div className="text-xs font-semibold truncate" style={{ color: isActive ? '#fff' : isUnlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{lvl.label}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Unlock button */}
                            {unlocked < LADDER_LEVELS.length && (
                                <button onClick={handleUnlock}
                                    className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
                                    style={{
                                        background: `linear-gradient(135deg, ${LADDER_LEVELS[unlocked].color}30, ${LADDER_LEVELS[unlocked].color}15)`,
                                        border: `1px solid ${LADDER_LEVELS[unlocked].color}50`,
                                        color: LADDER_LEVELS[unlocked].color,
                                        boxShadow: `0 4px 16px ${LADDER_LEVELS[unlocked].color}25`,
                                    }}>
                                    ✦ Unlock L{unlocked} — {LADDER_LEVELS[unlocked].label}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Active Level Detail */}
                    <div className="lg:col-span-8 flex flex-col gap-4">

                        {/* Active level card */}
                        <div key={activeLevel} className="rounded-2xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, animation: 'slideUpFade 0.3s ease-out forwards' }}>

                            {/* Card top bar */}
                            <div className="px-5 py-3.5 flex items-center gap-3"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `linear-gradient(90deg, ${ap.color}15, transparent)` }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                                    style={{ background: ap.color + '20', border: `1px solid ${ap.color}40` }}>{ap.emoji}</div>
                                <div>
                                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: ap.color }}>Level {ap.level} · {ap.label}</div>
                                    <div className="text-sm font-bold text-white">{ex.title}</div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ap.color }} />
                                    <span className="text-[9px] font-mono text-white/25">hash_map.py</span>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Level description */}
                                <p className="text-sm text-white/55 leading-relaxed">{ap.desc}</p>

                                {/* Mini code hint */}
                                <div className="rounded-xl overflow-hidden" style={{ background: '#05050f', border: `1px solid ${ap.color}20` }}>
                                    <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${ap.color}15` }}>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
                                            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(245,158,11,0.5)' }} />
                                            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
                                        </div>
                                        <span className="text-[9px] font-mono text-white/20">L{ap.level}_hint.py</span>
                                    </div>
                                    <div className="p-4 font-mono text-[12px] leading-relaxed" style={{ color: ap.color }}>
                                        <span className="text-white/20 mr-3 text-[9px]">1</span>{ex.hint}
                                    </div>
                                </div>

                                {/* Progress dots showing all levels */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/25 font-semibold">Progress:</span>
                                    <div className="flex items-center gap-1.5 flex-1">
                                        {LADDER_LEVELS.map((lvl, i) => (
                                            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-500"
                                                style={{
                                                    background: i < unlocked
                                                        ? (i <= activeLevel ? lvl.color : lvl.color + '40')
                                                        : 'rgba(255,255,255,0.07)',
                                                    boxShadow: i === activeLevel ? `0 0 8px ${lvl.color}80` : 'none',
                                                }} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ color: ap.color }}>{unlocked}/{LADDER_LEVELS.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom row: 3 quick stat pills */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Levels per approach', value: '6', sub: 'L0 → L5', icon: '🪜', c: '#6366f1' },
                                { label: 'Progressive unlock', value: '1 at a time', sub: 'earn your way up', icon: '🔓', c: '#10b981' },
                                { label: 'Each level has', value: 'Tests + Hints', sub: 'with explanation', icon: '💡', c: '#f59e0b' },
                            ].map(({ label, value, sub, icon, c }) => (
                                <div key={label} className="rounded-2xl p-4 flex flex-col gap-1"
                                    style={{ background: c + '08', border: `1px solid ${c}20` }}>
                                    <span className="text-base">{icon}</span>
                                    <div className="text-sm font-extrabold text-white">{value}</div>
                                    <div className="text-[10px] font-semibold" style={{ color: c }}>{label}</div>
                                    <div className="text-[9px] text-white/30">{sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LandingPage({ onStart, onExplore }) {
    const { isDark } = useTheme();
    return (
        <div className="overflow-y-auto h-full text-primary-text scroll-smooth bg-app-bg">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-15 animate-blob" style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)' }} />
                <div className="absolute top-[25%] -right-[10%] w-[35%] h-[35%] rounded-full blur-[140px] opacity-10 animate-blob animation-delay-2000" style={{ background: 'radial-gradient(circle, #06b6d4, #0ea5e9)' }} />
                <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full blur-[140px] opacity-10 animate-blob animation-delay-4000" style={{ background: 'radial-gradient(circle, #8b5cf6, #6366f1)' }} />
            </div>

            {/* HERO */}
            <section className="relative pt-32 pb-36 px-4 overflow-hidden">
                <BackgroundFx variant="hero" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">

                    {/* Left: Copy */}
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)' }}>
                            <Code className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#6366f1' }}>DSA · Courses · Visualize · Community</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tighter text-black">
                            Learn. Solve.
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                Actually understand it.
                            </span>
                        </h1>

                        {/* Subtext */}
                        <p className="text-xl text-neutral-600 mb-8 max-w-lg leading-relaxed font-medium">
                            Marevlo gives you the{' '}
                            <strong className="font-semibold" style={{ color: '#6366f1' }}>curriculum</strong>
                            , the{' '}
                            <strong className="font-semibold" style={{ color: '#8b5cf6' }}>tools</strong>
                            , and the{' '}
                            <strong className="font-semibold" style={{ color: '#06b6d4' }}>community</strong>
                            {' '}to go from complete beginner to a confident problem solver one concept at a time.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={onStart}
                                className="px-8 py-4 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center hover:-translate-y-0.5 hover:shadow-2xl"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                                }}
                            >
                                Start Learning <ChevronRight className="ml-2 w-5 h-5" />
                            </button>
                            <button
                                onClick={onExplore}
                                className="px-8 py-4 bg-white text-black border-2 border-neutral-200 rounded-xl font-bold text-lg hover:border-indigo-300 hover:bg-neutral-50 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                Explore Community
                            </button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-10">
                            {[
                                { l: 'DSA', c: '#6366f1' },
                                { l: 'Algorithms', c: '#8b5cf6' },
                                { l: 'Data Structures', c: '#06b6d4' },
                                { l: 'System Design', c: '#6366f1' },
                                { l: 'Visualization', c: '#8b5cf6' },
                                { l: 'Courses', c: '#06b6d4' },
                            ].map(({ l, c }) => (
                                <span
                                    key={l}
                                    className="px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:-translate-y-0.5"
                                    style={{ background: `${c}10`, borderColor: `${c}30`, color: c }}
                                >{l}</span>
                            ))}
                        </div>

                        {/* Feature Promises */}
                        <div className="flex flex-wrap gap-2 opacity-80">
                            {[
                                { label: 'Solve DSA like LeetCode', color: '#6366f1' },
                                { label: 'Visualize every concept', color: '#8b5cf6' },
                                { label: 'Learn with a community', color: '#06b6d4' },
                            ].map(({ label, color }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 px-3 py-2 rounded-full border transition-all hover:-translate-y-0.5 hover:opacity-100"
                                    style={{ background: `${color}05`, borderColor: `${color}20` }}
                                >
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="flex-shrink-0">
                                        <path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: `${color}CC` }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Animated Typing Terminal */}
                    <div className="relative hidden lg:block">
                        {/* Soft glow behind card */}
                        <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30 -z-10"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }} />
                        <TypingTerminal />
                    </div>
                </div>
            </section>

            {/* MAREVLO ECOSYSTEM: PLATFORM IN ACTION */}
            <section className="relative pt-32 pb-36 px-4 overflow-hidden">
                <BackgroundFx variant="hero" />

                <div className="max-w-7xl mx-auto px-4 relative z-10">

                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5"
                            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
                            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#6366f1' }}>Platform in Action</span>
                        </div>
                        <h2 className="text-5xl font-extrabold text-black tracking-tighter mb-4">
                            Everything you need,{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>built inside one platform</span>
                        </h2>
                        <p className="text-neutral-500 max-w-xl mx-auto text-lg">
                            Not a collection of random resources. A tightly integrated system — courses, problems, approaches, visualizations, and an AI assistant, all working together.
                        </p>
                    </div>

                    {/* BENTO GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 grid-rows-auto gap-4">

                        {/* ROW 1: METHODOLOGY */}

                        {/* [1] Approaches */}
                        <ApproachesCard isDark={isDark} />

                        {/* [2] Ladders */}
                        <LaddersCard isDark={isDark} />

                        {/* ROW 2 */}

                        {/* [3] Visualization — ANIMATED BFSVisualizer */}
                        <BFSVisualizer isDark={isDark} />

                        {/* [4] Courses — PREMIUM DARK (col 4) */}
                        <div className="lg:col-span-4 rounded-3xl border overflow-hidden relative group hover:scale-[1.01] transition-transform duration-300"
                            style={{
                                background: isDark ? '#0d0d0d' : 'linear-gradient(145deg, #1a2440, #263457)',
                                borderColor: 'rgba(99,102,241,0.3)'
                            }}>
                            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none"
                                style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)' }} />
                            <div className="p-6 relative z-10">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                                        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>🎓</div>
                                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#6366f1' }}>Our Courses</span>
                                    <div className="ml-auto text-[10px] font-semibold text-neutral-500">4 tracks</div>
                                </div>

                                {/* Real Marevlo courses */}
                                <div className="space-y-2.5">
                                    {[
                                        { title: 'Generative AI', emoji: '🧠', tag: 'Hot 🔥', lessons: 28, bar: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)', tagC: '#ef4444', glow: '#6366f120' },
                                        { title: 'Data Science', emoji: '📊', tag: 'New 🌟', lessons: 34, bar: 'linear-gradient(135deg,#10b981,#06b6d4,#6366f1)', tagC: '#10b981', glow: '#10b98120' },
                                        { title: 'Clustering', emoji: '🔵', tag: 'New ✨', lessons: 12, bar: 'linear-gradient(135deg,#f43f5e,#ec4899,#8b5cf6)', tagC: '#f43f5e', glow: '#f43f5e20' },
                                        { title: 'LangGraph', emoji: '⚡', tag: 'New 🌟', lessons: 8, bar: 'linear-gradient(135deg,#ec4899,#f43f5e,#8b5cf6)', tagC: '#ec4899', glow: '#ec489920' },
                                    ].map(({ title, emoji, tag, lessons, bar, tagC, glow }) => (
                                        <div key={title}
                                            className="relative flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                                            style={{ background: glow, border: `1px solid ${tagC}20` }}>

                                            {/* Left gradient bar */}
                                            <div className="w-1 h-9 rounded-full flex-shrink-0" style={{ background: bar, boxShadow: `0 0 8px ${tagC}60` }} />

                                            {/* Emoji icon */}
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                                                style={{ background: `${tagC}15` }}>{emoji}</div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-white truncate">{title}</div>
                                                <div className="text-[10px] text-neutral-500">{lessons} lessons</div>
                                            </div>

                                            {/* Tag */}
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: `${tagC}20`, color: tagC, border: `1px solid ${tagC}30` }}>{tag}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer hint */}
                                <div className="mt-4 flex items-center gap-1.5">
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                    <span className="text-[10px] font-semibold px-2" style={{ color: '#6366f1' }}>+ more coming soon</span>
                                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                            </div>
                        </div>

                        {/* [5] Personalized AI Tutor — MEDIUM (col 3) */}
                        <AITutorCard isDark={isDark} />

                        {/* ROW 3: ALL PROBLEMS */}

                        {/* [6] DSA Problems — LARGE dark card moved to bottom (col 12) */}
                        <div className="lg:col-span-12 rounded-[2rem] border overflow-hidden relative group hover:scale-[1.01] transition-transform duration-500 shadow-2xl"
                            style={{
                                background: isDark ? 'linear-gradient(145deg, #090914, #12122a)' : 'linear-gradient(145deg, #18243d, #243255)',
                                borderColor: 'rgba(99,102,241,0.5)',
                                boxShadow: isDark ? '0 20px 40px -10px rgba(99,102,241,0.15)' : '0 18px 36px -12px rgba(37,99,235,0.2)'
                            }}>
                            {/* Animated Background Gradients & Grids */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/5 hover:via-purple-500/10 to-transparent transition-colors duration-700"></div>
                            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-64 rounded-full blur-[100px] opacity-30 pointer-events-none animate-pulse"
                                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

                            <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row gap-12 items-center">
                                {/* Left desc */}
                                <div className="flex-1 relative">
                                    <div className="absolute -left-4 -top-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl"></div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-inner overflow-hidden relative"
                                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)' }}>
                                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-transparent"></div>
                                            <span className="relative z-10 text-lg">🚀</span>
                                        </div>
                                        <span className="text-xs font-black tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Massive Question Bank</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 leading-tight">
                                        1,000+ Interactive<br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Challenges</span>
                                    </h3>
                                    <p className="text-neutral-300 text-sm md:text-base max-w-md mb-8 leading-relaxed font-medium">Dive into our massive syllabus covering every core pattern. Each question features stunning visualizers, multi-approach ladders, and an integrated AI IDE to keep you hooked.</p>

                                    <div className="flex flex-wrap gap-3">
                                        {[['1000+ Questions', '#10b981'], ['Interactive IDE', '#8b5cf6'], ['Visualizers', '#ec4899']].map(([text, color]) => (
                                            <div key={text} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md transition-all hover:-translate-y-1 cursor-default"
                                                style={{ background: `${color}15`, color: color, border: `1px solid ${color}40`, boxShadow: `0 4px 12px ${color}10` }}>
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                                                {text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right mini list */}
                                <div className="flex-1 w-full relative pt-2">
                                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgb(12,12,28)] to-transparent z-10 pointer-events-none rounded-b-3xl"></div>

                                    <div className="space-y-3 relative z-0">
                                        {[
                                            { num: '#42', name: 'Trapping Rain Water', diff: 'Hard', done: true, dc: '#ef4444', views: '24k' },
                                            { num: '#105', name: 'Construct Binary Tree', diff: 'Medium', done: true, dc: '#f59e0b', views: '18k' },
                                            { num: '#146', name: 'LRU Cache Design', diff: 'Medium', done: false, dc: '#f59e0b', views: '45k' },
                                            { num: '#200', name: 'Number of Islands', diff: 'Medium', done: false, dc: '#f59e0b', views: '32k' },
                                            { num: '#295', name: 'Find Median from Data', diff: 'Hard', done: false, dc: '#ef4444', views: '12k' },
                                        ].map(({ num, name, diff, done, dc, views }, i) => (
                                            <div key={num} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 hover:bg-white/10 cursor-pointer ${i > 2 ? 'opacity-80' : ''} ${i > 3 ? 'opacity-40 blur-[1px]' : ''}`}
                                                style={{ border: '1px solid rgba(255,255,255,0.08)', transform: `translateX(${i * 6}px)` }}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-indigo-500/20' : ''}`}
                                                    style={{ borderColor: done ? '#6366f1' : 'rgba(255,255,255,0.2)' }}>
                                                    {done && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                                                    {!done && <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />}
                                                </div>
                                                <span className="text-neutral-500 text-xs font-mono w-8">{num}</span>
                                                <span className="text-neutral-200 text-sm font-semibold flex-1 tracking-wide">{name}</span>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm"
                                                        style={{ background: `${dc}18`, color: dc, border: `1px solid ${dc}35` }}>{diff}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center pt-8 relative z-20">
                                        <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold tracking-wide hover:bg-indigo-500/20 hover:text-white transition-all hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                            <span>Explore All 1000+ Problems</span>
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* HOW IT WORKS - REDESIGNED */}
            <section className="py-32 relative overflow-hidden bg-black">
                {/* Background glow effects */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-indigo-600/10"></div>
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none bg-purple-600/8"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r mb-6 tracking-tight from-white via-indigo-100 to-indigo-300">Your Path to Mastery</h2>
                        <p className="text-lg max-w-2xl mx-auto leading-relaxed text-neutral-400">
                            A structured, scientifically-backed workflow designed to take you from novice to expert through consistent practice and AI-driven feedback.
                        </p>
                    </div>

                    <div className="relative pt-10 pb-20">
                        {/* CSS Keyframes for continuous animatonic floating */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                @keyframes floatCard1 { 0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); } 50% { transform: translateY(-20px) scale(1.02) rotate(-1deg); } }
                                @keyframes floatCard2 { 0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); } 50% { transform: translateY(25px) scale(1.03) rotate(1.5deg); } }
                                @keyframes floatCard3 { 0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); } 50% { transform: translateY(-25px) scale(1.01) rotate(-1.5deg); } }
                                @keyframes floatCard4 { 0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); } 50% { transform: translateY(30px) scale(1.04) rotate(1deg); } }
                                @keyframes spinSlow { 100% { transform: rotate(360deg); } }
                                .animate-float-1 { animation: floatCard1 6s ease-in-out infinite; }
                                .animate-float-2 { animation: floatCard2 7s ease-in-out infinite; }
                                .animate-float-3 { animation: floatCard3 6.5s ease-in-out infinite; }
                                .animate-float-4 { animation: floatCard4 7.5s ease-in-out infinite; }
                            ` }} />

                        {/* Staggered, overlapping animated floating cards */}
                        <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-0 relative z-10 md:h-[450px]">
                            {[
                                { step: "01", title: "Set Goals", desc: "Define your level & identify weak algorithmic spots.", icon: "🎯", color: "#4f46e5", anim: "animate-float-1", offset: "md:-mt-32 md:z-10" },
                                { step: "02", title: "Practice", desc: "Solve adaptive challenges daily in our immersive IDE.", icon: "⌨️", color: "#2563eb", anim: "animate-float-2", offset: "md:mt-32 md:-ml-8 md:z-20" },
                                { step: "03", title: "Collaborate", desc: "Review multi-approach code with community peers.", icon: "🤝", color: "#9333ea", anim: "animate-float-3", offset: "md:-mt-24 md:-ml-8 md:z-30" },
                                { step: "04", title: "Succeed", desc: "Crush those hard interviews and get verified.", icon: "🚀", color: "#db2777", anim: "animate-float-4", offset: "md:mt-40 md:-ml-8 md:z-40" }
                            ].map((item, i) => (
                                <div key={i} className={`relative group w-full max-w-[300px] md:w-[280px] p-8 md:p-10 rounded-[2.5rem] transition-all duration-700 hover:scale-[1.15] hover:z-50 ${item.anim} ${item.offset} backdrop-blur-2xl`}
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(20,20,20,0.8) 0%, rgba(0,0,0,0.95) 100%)',
                                        border: `1px solid ${item.color}50`,
                                        boxShadow: `0 30px 60px -20px rgba(0,0,0,0.8), inset 0 0 20px ${item.color}15`
                                    }}>

                                    {/* Intense Hover Aura */}
                                    <div className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${item.color}, transparent 70%)` }}></div>
                                    <div className="absolute -inset-[2px] rounded-[2.6rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10 blur-xl block" style={{ background: `linear-gradient(45deg, ${item.color}, transparent, ${item.color})`, animation: 'spinSlow 10s linear infinite' }}></div>

                                    {/* Number Badge */}
                                    <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-xl text-white shadow-2xl border-4 border-black group-hover:rotate-[360deg] transition-transform duration-[1.5s] ease-in-out"
                                        style={{ background: `linear-gradient(135deg, ${item.color}, #000)`, boxShadow: `0 10px 40px -5px ${item.color}` }}>
                                        {item.step}
                                    </div>

                                    {/* Icon & Content */}
                                    <div className="text-6xl mb-6 group-hover:-translate-y-4 group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{item.icon}</div>
                                    <h3 className="text-2xl font-black mb-3 tracking-tighter text-white" style={{ textShadow: `0 0 20px ${item.color}40` }}>{item.title}</h3>
                                    <p className="text-sm leading-relaxed font-medium transition-colors text-neutral-300 group-hover:text-white">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* "Start Building" Footer Banner - REDESIGNED */}
            <section className={`py-32 relative overflow-hidden flex items-center justify-center border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}
                style={{ background: isDark
                    ? 'radial-gradient(ellipse at bottom, #1B1B3A 0%, #05050A 100%)'
                    : 'radial-gradient(ellipse at bottom, #eef2ff 0%, #f8fafc 100%)'
                }}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

                {/* Glowing Grid Background */}
                <div className={`absolute inset-0 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none ${isDark ? 'bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)]'}`}></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">

                    <h2 className={`text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-[1.1] ${isDark ? 'text-white drop-shadow-2xl' : 'text-gray-900'}`}>
                        Ready to level up? <br />
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-indigo-400 via-purple-400 to-cyan-400' : 'from-indigo-600 via-purple-600 to-cyan-600'}`}>Start coding today.</span>
                    </h2>

                    <button onClick={onStart} className={`group relative inline-flex items-center justify-center px-10 py-5 text-xl md:text-2xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]' : 'bg-indigo-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDark ? 'from-indigo-100 via-white to-purple-100' : 'from-indigo-500 via-indigo-600 to-purple-600'}`}></div>
                        <span className="relative z-10 flex items-center gap-3">
                            Start building for free
                            <svg className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </button>

                    <p className={`mt-8 text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Join thousands of developers mastering algorithms.</p>
                </div>
            </section>
        </div>
    );
}
