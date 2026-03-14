import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, Play, BookOpen, Layers, Brain,
    Database, FileText, Search, Zap, Globe, Code2,
    Cpu, GitBranch, FlaskConical, Video, Image, ScanText,
    Hash, Network, ServerCog, Sparkles, Home, ArrowLeft,
    Clock, Star, Lock
} from 'lucide-react';

// ─────────────────────────────────────────────
//  COURSE DATA TREE
//  isLeaf = true → navigates to course content
// ─────────────────────────────────────────────
const COURSE_TREE = [
    {
        id: 'gen-ai',
        label: 'Generative AI',
        description: 'Master modern AI systems — from LLMs to production-ready RAG pipelines.',
        icon: Brain,
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        lineGradient: 'from-indigo-500 via-purple-500 to-cyan-500',
        tag: 'Hot 🔥',
        tagColor: '#ef4444',
        children: [
            {
                id: 'rag',
                label: 'RAG',
                description: 'Retrieval-Augmented Generation — build context-aware AI systems with vector databases and grounding.',
                icon: Database,
                gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                lineGradient: 'from-violet-500 via-cyan-500 to-blue-500',
                tag: 'Advanced',
                tagColor: '#8b5cf6',
                children: [
                    { id: 'rag-intro', label: 'Introduction', description: 'What is RAG and why it matters for modern AI applications.', icon: BookOpen, isLeaf: true, duration: '15m', level: 'Beginner' },
                    { id: 'rag-phases', label: 'Phases of RAG', description: 'Understand the complete pipeline: ingestion, retrieval, and generation.', icon: Layers, isLeaf: true, duration: '25m', level: 'Beginner' },
                    {
                        id: 'ingestion',
                        label: 'Ingestion',
                        description: 'Deep dive into document ingestion strategies, parsers, and chunking pipelines.',
                        icon: ServerCog,
                        gradient: 'linear-gradient(135deg, #06b6d4, #10b981)',
                        lineGradient: 'from-cyan-500 via-teal-500 to-emerald-500',
                        tag: 'Core Module',
                        tagColor: '#06b6d4',
                        children: [
                            { id: 'docformer', label: 'Docformer', description: 'Transformer-based document understanding for structured and semi-structured files.', icon: FileText, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'doc-to-image', label: 'Document to Image', description: 'Convert documents to visual representations for multi-modal processing.', icon: Image, isLeaf: true, duration: '20m', level: 'Intermediate' },
                            { id: 'ocr-layout', label: 'OCR Layout Recognition', description: 'Recognize and parse page layout structures from scanned documents.', icon: ScanText, isLeaf: true, duration: '25m', level: 'Intermediate' },
                            { id: 'ocr-text', label: 'OCR Text Recognition', description: 'Extract clean text from images using modern OCR techniques.', icon: ScanText, isLeaf: true, duration: '20m', level: 'Intermediate' },
                            { id: 'max-seq', label: 'Maximal Sequential Phrases', description: 'Advanced phrase extraction for better semantic chunking.', icon: Hash, isLeaf: true, duration: '35m', level: 'Advanced' },
                            { id: 'infonce', label: 'InfoNCE', description: 'Noise-contrastive estimation for training dense retrieval models.', icon: FlaskConical, isLeaf: true, duration: '40m', level: 'Expert' },
                            { id: 'video-ingestion', label: 'Video Ingestion', description: 'End-to-end pipeline for ingesting and indexing video content.', icon: Video, isLeaf: true, duration: '45m', level: 'Advanced' },
                        ],
                    },
                    { id: 'rag-database', label: 'Database', description: 'Vector stores, similarity search, and hybrid retrieval strategies.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'rag-retrieval', label: 'Retrieval', description: 'Dense, sparse & hybrid retrieval — BM25, FAISS, and beyond.', icon: Search, isLeaf: true, duration: '35m', level: 'Intermediate' },
                    { id: 'rag-prompt-eng', label: 'Prompt Engineering', description: 'Craft precise prompts that ground the LLM in retrieved context.', icon: Sparkles, isLeaf: true, duration: '25m', level: 'Intermediate' },
                    { id: 'rag-grounding', label: 'Grounding', description: 'Techniques to reduce hallucination and anchor outputs to real data.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-api', label: 'API and LLM Mastering', description: 'Integrate OpenAI, Claude, Gemini APIs into production RAG systems.', icon: Code2, isLeaf: true, duration: '50m', level: 'Advanced' },
                ],
            },
            {
                id: 'vectorless-rag',
                label: 'Vectorless RAG',
                description: 'Context-aware retrieval without vector embeddings — BM25, lexical search, and beyond.',
                icon: Search,
                gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                lineGradient: 'from-amber-500 via-orange-500 to-red-500',
                tag: 'Intermediate',
                tagColor: '#f59e0b',
                isLeaf: true,
                duration: '8h',
                level: 'Intermediate',
            },
            {
                id: 'multimodal-rag',
                label: 'Multimodal RAG',
                description: 'Build RAG systems that understand and retrieve from images, video, audio, and text.',
                icon: Image,
                gradient: 'linear-gradient(135deg, #06b6d4, #10b981)',
                lineGradient: 'from-cyan-500 via-teal-500 to-emerald-500',
                tag: 'Advanced',
                tagColor: '#06b6d4',
                isLeaf: true,
                duration: '10h',
                level: 'Advanced',
            },
        ],
    },
    // Add more top-level categories here:
    // { id: 'dsa', label: 'Data Structures & Algorithms', ... }
    {
        id: 'data-science',
        label: 'Data Science',
        description: 'From Python basics to deep learning — a complete data science curriculum.',
        icon: FlaskConical,
        gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #6366f1 100%)',
        lineGradient: 'from-emerald-500 via-cyan-500 to-indigo-500',
        shadow: 'rgba(16,185,129,0.3)',
        tag: 'New 🌟',
        tagColor: '#10b981',
        children: [
            {
                id: 'ds-python',
                label: 'Python',
                description: 'Master Python fundamentals essential for data science — syntax, data structures, and scripting.',
                icon: Code2,
                gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                lineGradient: 'from-indigo-500 via-violet-500 to-purple-500',
                tag: 'Beginner',
                tagColor: '#10b981',
                isLeaf: true,
                duration: '10h',
                level: 'Beginner',
            },
            {
                id: 'data-analysis',
                label: 'Data Analysis',
                description: 'Wrangle, clean, and analyze real-world datasets using the most powerful Python libraries.',
                icon: Search,
                gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                lineGradient: 'from-amber-500 via-orange-500 to-red-500',
                tag: 'Core',
                tagColor: '#f59e0b',
                children: [
                    { id: 'numpy', label: 'NumPy', description: 'High-performance numerical computing — arrays, broadcasting, and linear algebra.', icon: Cpu, isLeaf: true, duration: '6h', level: 'Beginner' },
                    { id: 'pandas', label: 'Pandas', description: 'DataFrames, groupby, merges, and time-series analysis for structured data.', icon: Database, isLeaf: true, duration: '8h', level: 'Intermediate' },
                ],
            },
            {
                id: 'data-visualization',
                label: 'Data Visualization',
                description: 'Turn raw data into compelling visual stories with Python\'s top charting libraries.',
                icon: Layers,
                gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                lineGradient: 'from-pink-500 via-fuchsia-500 to-violet-500',
                tag: 'Creative',
                tagColor: '#ec4899',
                children: [
                    { id: 'matplotlib', label: 'Matplotlib', description: 'The foundation of Python plotting — fine-grained control over every chart element.', icon: Zap, isLeaf: true, duration: '5h', level: 'Beginner' },
                    { id: 'seaborn', label: 'Seaborn', description: 'Statistical visualization built on Matplotlib — beautiful plots with minimal code.', icon: Sparkles, isLeaf: true, duration: '4h', level: 'Intermediate' },
                    { id: 'plotly', label: 'Plotly', description: 'Interactive, web-ready charts and dashboards with Plotly and Dash.', icon: Globe, isLeaf: true, duration: '5h', level: 'Intermediate' },
                ],
            },
            {
                id: 'machine-learning',
                label: 'Machine Learning',
                description: 'Build, train, and evaluate classical ML models using Scikit-learn.',
                icon: Brain,
                gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                lineGradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                tag: 'Advanced',
                tagColor: '#6366f1',
                children: [
                    { id: 'sklearn', label: 'Scikit-learn', description: 'Classification, regression, clustering, pipelines, and model evaluation.', icon: GitBranch, isLeaf: true, duration: '12h', level: 'Intermediate' },
                ],
            },
            {
                id: 'deep-learning',
                label: 'Deep Learning',
                description: 'From neural network fundamentals to training production-grade models.',
                icon: Network,
                gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                lineGradient: 'from-violet-500 via-purple-500 to-cyan-500',
                tag: 'Expert',
                tagColor: '#8b5cf6',
                children: [
                    { id: 'pytorch', label: 'PyTorch', description: 'Tensors, autograd, neural network architectures, and model training with PyTorch.', icon: Cpu, isLeaf: true, duration: '15h', level: 'Advanced' },
                ],
            },
        ],
    },
    {
        id: 'clustering',
        label: 'Clustering',
        description: 'Understand unsupervised learning through hands-on clustering techniques and algorithms.',
        icon: GitBranch,
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%)',
        lineGradient: 'from-rose-500 via-pink-500 to-violet-500',
        shadow: 'rgba(244,63,94,0.3)',
        tag: 'New ✨',
        tagColor: '#f43f5e',
        children: [
            { id: 'clustering-part1', label: 'Part 1', description: 'Introduction to clustering — core concepts, distance metrics, and problem formulation.', icon: BookOpen, isLeaf: true, duration: '1h 30m', level: 'Beginner' },
            { id: 'clustering-part2', label: 'Part 2', description: 'K-Means, K-Medoids, and centroid-based clustering with hands-on implementation.', icon: Cpu, isLeaf: true, duration: '2h', level: 'Intermediate' },
            { id: 'clustering-part3', label: 'Part 3', description: 'Hierarchical clustering, DBSCAN, and density-based methods for complex data shapes.', icon: Network, isLeaf: true, duration: '2h', level: 'Intermediate' },
            { id: 'clustering-part4', label: 'Part 4', description: 'Evaluation metrics, cluster validation, and real-world clustering project.', icon: FlaskConical, isLeaf: true, duration: '2h 30m', level: 'Advanced' },
        ],
    },
];



// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const LEVEL_COLORS = {
    'Beginner': { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    'Intermediate': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    'Advanced': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    'Expert': { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
};

// Count all leaf descendants
function countLeaves(node) {
    if (node.isLeaf) return 1;
    if (!node.children) return 0;
    return node.children.reduce((s, c) => s + countLeaves(c), 0);
}

// Walk path of ids to find a node
function findNode(tree, path) {
    if (!path.length) return null;
    let current = tree.find(n => n.id === path[0]);
    for (let i = 1; i < path.length; i++) {
        if (!current?.children) return null;
        current = current.children.find(n => n.id === path[i]);
    }
    return current;
}

// ─────────────────────────────────────────────
//  COURSE CARD — both branch (folder) & leaf
// ─────────────────────────────────────────────
function CourseCard({ node, onDrillDown, onStartLeaf, isRootCategory }) {
    const [hovered, setHovered] = useState(false);
    const Icon = node.icon ?? BookOpen;
    const isFolder = !node.isLeaf;
    const leafCount = isFolder ? countLeaves(node) : 0;
    const lvl = LEVEL_COLORS[node.level] ?? LEVEL_COLORS['Intermediate'];

    return (
        <div
            className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${hovered ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                boxShadow: hovered ? '0 12px 40px rgba(99,102,241,0.18)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => isFolder ? onDrillDown(node) : onStartLeaf(node)}
        >
            {/* Gradient top line */}
            <div className={`h-[3px] bg-gradient-to-r ${node.lineGradient || 'from-indigo-500 via-purple-500 to-cyan-500'}`} />

            <div className="p-5 flex-1 flex flex-col gap-3">
                {/* Icon + tag row */}
                <div className="flex items-start justify-between gap-2">
                    <div style={{
                        width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                        background: node.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: hovered ? '0 6px 18px rgba(99,102,241,0.35)' : 'none',
                        transition: 'box-shadow 0.3s',
                    }}>
                        <Icon size={20} style={{ color: '#fff' }} />
                    </div>

                    {node.tag && (
                        <span style={{
                            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
                            textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999,
                            background: `${node.tagColor}18`, color: node.tagColor,
                            border: `1px solid ${node.tagColor}35`,
                            flexShrink: 0,
                        }}>
                            {node.tag}
                        </span>
                    )}
                    {node.level && !node.tag && (
                        <span style={{
                            fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
                            textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999,
                            background: lvl.bg, color: lvl.color, flexShrink: 0,
                        }}>
                            {node.level}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h4 className="text-base font-bold leading-snug transition-colors duration-200"
                    style={{ color: hovered ? '#6366f1' : 'var(--color-primary-text)' }}>
                    {node.label}
                </h4>

                {/* Description */}
                <p className="text-sm leading-relaxed line-clamp-2 flex-1"
                    style={{ color: 'var(--color-muted-text)' }}>
                    {node.description || 'Explore this topic to learn more.'}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1 mt-auto">
                    {/* Meta info */}
                    <div className="flex items-center gap-3">
                        {node.duration && (
                            <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)' }}>
                                <Clock size={11} /> {node.duration}
                            </span>
                        )}
                        {isFolder && (
                            <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)' }}>
                                <BookOpen size={11} /> {leafCount} lesson{leafCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* CTA button */}
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                        style={{
                            background: hovered
                                ? (node.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)')
                                : 'var(--color-surface-hover)',
                            color: hovered ? '#fff' : 'var(--color-primary-text)',
                            boxShadow: hovered ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                        }}
                    >
                        {isFolder
                            ? <><ChevronRight size={13} /> Explore</>
                            : <><Play size={13} fill="currentColor" /> Start</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  ROOT CATEGORY HERO (top-level section header)
// ─────────────────────────────────────────────
function RootCategoryHero({ node }) {
    const Icon = node.icon ?? Brain;
    const totalLessons = countLeaves(node);
    return (
        <div className="relative rounded-2xl overflow-hidden mb-6 p-6"
            style={{ background: node.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: `0 8px 32px ${node.shadow || 'rgba(99,102,241,0.3)'}` }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: '25%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div className="relative z-10 flex items-center gap-4">
                <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={28} color="#fff" />
                </div>
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                        Course Category
                    </div>
                    <h2 className="text-2xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>{node.label}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', marginTop: 2 }}>
                        {node.description || ''} &nbsp;·&nbsp; {totalLessons} lessons
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  BREADCRUMB
// ─────────────────────────────────────────────
function Breadcrumb({ path, onNavigate }) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap mb-6">
            <button
                onClick={() => onNavigate([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{ background: 'var(--color-surface-hover)', color: 'var(--color-muted-text)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted-text)'}
            >
                <Home size={12} /> All Courses
            </button>

            {path.map((crumb, i) => (
                <React.Fragment key={crumb.id}>
                    <ChevronRight size={12} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
                    <button
                        onClick={() => onNavigate(path.slice(0, i + 1).map(c => c.id))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={{
                            background: i === path.length - 1 ? 'rgba(99,102,241,0.12)' : 'var(--color-surface-hover)',
                            color: i === path.length - 1 ? '#6366f1' : 'var(--color-muted-text)',
                        }}
                        onMouseEnter={e => { if (i < path.length - 1) e.currentTarget.style.color = 'var(--color-primary-text)'; }}
                        onMouseLeave={e => { if (i < path.length - 1) e.currentTarget.style.color = 'var(--color-muted-text)'; }}
                    >
                        {crumb.label}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
export default function Courses() {
    const navigate = useNavigate();
    // pathIds = array of node IDs from root to current folder
    const [pathIds, setPathIds] = useState([]);

    // Resolve current items to display
    const getCurrentItems = () => {
        if (!pathIds.length) return COURSE_TREE; // top level
        const node = findNode(COURSE_TREE, pathIds);
        return node?.children ?? [];
    };

    // Resolve breadcrumb nodes
    const getBreadcrumbs = () => {
        const crumbs = [];
        for (let i = 0; i < pathIds.length; i++) {
            const node = findNode(COURSE_TREE, pathIds.slice(0, i + 1));
            if (node) crumbs.push(node);
        }
        return crumbs;
    };

    // Find the parent node if we're inside a folder
    const parentNode = pathIds.length ? findNode(COURSE_TREE, pathIds) : null;
    // Detect if current parent is the root topic
    const isInsideRootCategory = pathIds.length === 1;
    // Root category node (for hero)
    const rootCatNode = pathIds.length ? findNode(COURSE_TREE, [pathIds[0]]) : null;

    const handleDrillDown = (node) => {
        setPathIds(prev => [...prev, node.id]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNavigate = (ids) => {
        setPathIds(ids);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartLeaf = (node) => {
        navigate(`/course/${node.id}`);
    };

    const currentItems = getCurrentItems();
    const breadcrumbs = getBreadcrumbs();
    const totalAllLessons = COURSE_TREE.reduce((s, n) => s + countLeaves(n), 0);

    return (
        <div className="min-h-screen w-full overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>

            {/* Ambient orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -120, left: -100, background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', filter: 'blur(70px)' }} />
                <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', bottom: '5%', right: -80, background: 'radial-gradient(circle, rgba(6,182,212,0.09), transparent 70%)', filter: 'blur(60px)' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">

                {/* ── Home-level header ── */}
                {!pathIds.length && (
                    <header className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <Sparkles size={13} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Structured Curriculum
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3"
                            style={{ color: 'var(--color-primary-text)', letterSpacing: '-0.03em' }}>
                            Course Library
                        </h1>
                        <p style={{ color: 'var(--color-muted-text)', maxWidth: 460, margin: '0 auto', fontSize: '0.95rem' }}>
                            Explore our structured learning paths. Dive deep into any topic to start learning.
                        </p>
                        {/* Stats */}
                        <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
                            {[
                                { label: 'Categories', value: COURSE_TREE.length },
                                { label: 'Total Lessons', value: totalAllLessons },
                                { label: 'Difficulty', value: 'All Levels' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col items-center">
                                    <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {value}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--color-muted-text)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </header>
                )}

                {/* ── Breadcrumb (when inside a folder) ── */}
                {pathIds.length > 0 && (
                    <Breadcrumb path={breadcrumbs} onNavigate={handleNavigate} />
                )}

                {/* ── Root category hero (shown when drilling into a category) ── */}
                {isInsideRootCategory && rootCatNode && (
                    <RootCategoryHero node={rootCatNode} />
                )}

                {/* ── Section title for sub-folders ── */}
                {parentNode && !isInsideRootCategory && (
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            onClick={() => handleNavigate(pathIds.slice(0, -1))}
                            className="p-2 rounded-xl transition-all duration-200"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                        >
                            <ArrowLeft size={16} style={{ color: '#6366f1' }} />
                        </button>
                        <div>
                            <h2 className="text-xl font-extrabold" style={{ color: 'var(--color-primary-text)', letterSpacing: '-0.02em' }}>
                                {parentNode.label}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-text)' }}>
                                {countLeaves(parentNode)} lesson{countLeaves(parentNode) !== 1 ? 's' : ''} in this section
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Cards Grid ── */}
                {currentItems.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed var(--color-border)', background: 'rgba(99,102,241,0.03)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                            <BookOpen size={28} color="#fff" />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary-text)' }}>No courses yet</h3>
                        <p style={{ color: 'var(--color-muted-text)', fontSize: '0.9rem' }}>Courses are being added. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {currentItems.map(node => (
                            <CourseCard
                                key={node.id}
                                node={node}
                                onDrillDown={handleDrillDown}
                                onStartLeaf={handleStartLeaf}
                                isRootCategory={!pathIds.length}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <p style={{ color: 'var(--color-muted-text)', fontSize: '0.85rem' }}>More courses coming soon ✨</p>
                </div>
            </div>
        </div>
    );
}
