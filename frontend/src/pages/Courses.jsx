import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronRight, Play, BookOpen, Layers, Brain,
    Database, FileText, Search, Zap, Globe, Code2,
    Cpu, GitBranch, FlaskConical, Video, Image, ScanText,
    Hash, Network, ServerCog, Sparkles, Home, ArrowLeft,
    Clock, Star, Lock, GraduationCap, Filter, X, ScanEye, MousePointer2
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
                    { id: 'rag-module-0', label: 'Module 0', description: 'Introduction to RAG fundamentals.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'rag-module-1', label: 'Module 1', description: 'Core RAG concepts and architecture.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'rag-module-2', label: 'Module 2', description: 'Embeddings: How text becomes vectors.', icon: Search, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'rag-module-3', label: 'Module 3', description: 'Vector databases for storing and querying embeddings.', icon: Database, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'rag-module-4', label: 'Module 4', description: 'Ingestion pipeline: loading, parsing, and processing documents.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'rag-module-5', label: 'Module 5', description: 'Chunking strategies for optimal retrieval.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    {
                        id: 'rag-module-6',
                        label: 'Module 6',
                        description: 'Retrieval methods: sparse, dense, and learned sparse.',
                        icon: Zap,
                        gradient: 'linear-gradient(135deg, #06b6d4, #10b981)',
                        lineGradient: 'from-cyan-500 via-teal-500 to-emerald-500',
                        tag: 'Explore',
                        tagColor: '#06b6d4',
                        children: [
                            { id: 'rag-module-6a', label: '6A', description: 'Sparse Retrieval: BM25 and term-based methods.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'rag-module-6b', label: '6B', description: 'Dense Retrieval: Bi-Encoders, DPR, ColBERT.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'rag-module-6c', label: '6C', description: 'Learned Sparse retrieval and Decision Matrix.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                        ],
                    },
                    { id: 'rag-module-7', label: 'Module 7', description: 'Hybrid Search and Reciprocal Rank Fusion (RRF).', icon: Globe, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'rag-module-8', label: 'Module 8', description: 'Reranking: refining retrieval results for precision.', icon: Code2, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'rag-module-9', label: 'Module 9', description: 'Generation: Prompting, Grounding, and Hallucination.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-module-10', label: 'Module 10', description: 'Advanced RAG Patterns for complex use cases.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-module-11', label: 'Module 11', description: 'Structured RAG over tables, SQL, and knowledge graphs.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-module-12', label: 'Module 12', description: 'Agentic RAG: autonomous reasoning and tool use.', icon: FlaskConical, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-module-13', label: 'Module 13', description: 'Production RAG: scaling, monitoring, and deployment.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'rag-module-14', label: 'Module 14', description: 'Evaluation: measuring what matters in RAG systems.', icon: ServerCog, isLeaf: true, duration: '30m', level: 'Advanced' },
                    {
                        id: 'rag-ingestion',
                        label: 'Ingestion',
                        description: 'Deep dive into document ingestion strategies, parsers, and chunking pipelines.',
                        icon: ServerCog,
                        gradient: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                        lineGradient: 'from-pink-500 via-purple-500 to-violet-500',
                        tag: 'Explore',
                        tagColor: '#f472b6',
                        children: [
                            {
                                id: 'rag-ingestion-ocr',
                                label: 'OCR',
                                description: 'Optical Character Recognition for document text extraction.',
                                icon: ScanText,
                                gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                lineGradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                                tag: 'Explore',
                                tagColor: '#06b6d4',
                                children: [
                                    {
                                        id: 'rag-ingestion-ocr-layout',
                                        label: 'Document Layout Analysis',
                                        description: 'Recognize and parse page layout structures from scanned documents.',
                                        icon: ScanText,
                                        gradient: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                                        lineGradient: 'from-violet-500 via-indigo-500 to-purple-500',
                                        tag: 'Explore',
                                        tagColor: '#a78bfa',
                                        children: [
                                            { id: 'dla-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'dla-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'dla-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'dla-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'dla-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'dla-module-5', label: 'Module 5', description: 'Module 5 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'dla-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'dla-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'dla-module-8', label: 'Module 8', description: 'Module 8 content.', icon: Code2, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'dla-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'dla-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-11', label: 'Module 11', description: 'Module 11 content.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-12', label: 'Module 12', description: 'Module 12 content.', icon: FlaskConical, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-13', label: 'Module 13', description: 'Module 13 content.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-14', label: 'Module 14', description: 'Module 14 content.', icon: ServerCog, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-15', label: 'Module 15', description: 'Module 15 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-16', label: 'Module 16', description: 'Module 16 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'dla-module-17', label: 'Module 17', description: 'Module 17 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Advanced' },
                                        ],
                                    },
                                    {
                                        id: 'rag-ingestion-ocr-text',
                                        label: 'Text Recognition Engineering',
                                        description: 'Extract clean text from images using modern OCR techniques.',
                                        icon: FileText,
                                        isLeaf: false,
                                        duration: '20m',
                                        level: 'Intermediate',
                                        children: [
                                            { id: 'ocr-text-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'ocr-text-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'ocr-text-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'ocr-text-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Beginner' },
                                            { id: 'ocr-text-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-5', label: 'Module 5', description: 'Module 5 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-8', label: 'Module 8', description: 'Module 8 content.', icon: Code2, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                            { id: 'ocr-text-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'ocr-text-module-11', label: 'Module 11', description: 'Module 11 content.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'ocr-text-module-12', label: 'Module 12', description: 'Module 12 content.', icon: FlaskConical, isLeaf: true, duration: '30m', level: 'Advanced' },
                                            { id: 'ocr-text-module-13', label: 'Module 13', description: 'Module 13 content.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },
                                        ],
                                    },
                                ],
                            },
                            {
                                id: 'rag-ingestion-dit',
                                label: 'DIT',
                                description: 'Document Image Transformer for visual document understanding.',
                                icon: Image,
                                isLeaf: false,
                                duration: '6h',
                                level: 'Intermediate',
                                children: [
                                    { id: 'dit-module-0', label: 'Module 0', description: 'Introduction to Document Image Transformers.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                                    { id: 'dit-module-1', label: 'Module 1', description: 'Vision Transformer (ViT) basics for document images.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                                    { id: 'dit-module-2', label: 'Module 2', description: 'Patch embedding and positional encoding.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'dit-module-3', label: 'Module 3', description: 'Self-attention mechanisms on document patches.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'dit-module-4', label: 'Module 4', description: 'Multi-modal fusion: Text and visual features.', icon: FileText, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'dit-module-5', label: 'Module 5', description: 'Pre-training objectives for DiT.', icon: Brain, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'dit-module-6', label: 'Module 6', description: 'Fine-tuning DiT for downstream tasks.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'dit-module-7', label: 'Module 7', description: 'Document layout analysis with DiT.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'dit-module-8', label: 'Module 8', description: 'Information extraction using DiT.', icon: Code2, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'dit-module-9', label: 'Module 9', description: 'Handling varying document resolutions.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Expert' },
                                    { id: 'dit-module-10', label: 'Module 10', description: 'Optimizing DiT inference speed.', icon: Network, isLeaf: true, duration: '30m', level: 'Expert' },
                                    { id: 'dit-module-11', label: 'Module 11', description: 'Real-world case studies and deployment.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Expert' },
                                ]
                            },
                            { id: 'rag-ingestion-doc', label: 'DOC', description: 'Document parsing and structured extraction pipelines.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'rag-ingestion-msp', label: 'MSP', description: 'Maximal Sequential Phrases for semantic chunking.', icon: Hash, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            {
                                id: 'rag-ingestion-docformer',
                                label: 'Docformer',
                                description: 'Multi-modal transformer that fuses text, layout, and image features for end-to-end document understanding.',
                                icon: ScanEye,
                                isLeaf: false,
                                duration: '5h',
                                level: 'Advanced',
                                children: [
                                    { id: 'docformer-module-1', label: 'Module 1', description: 'Module 1 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'docformer-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'docformer-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'docformer-module-4', label: 'Module 4', description: 'Module 4 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'docformer-module-5', label: 'Module 5', description: 'Module 5 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'docformer-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'docformer-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'docformer-module-8', label: 'Module 8', description: 'Module 8 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'docformer-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Code2, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'docformer-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                                ]
                            },
                            {
                                id: 'rag-ingestion-infonce',
                                label: 'InfoNCE',
                                description: 'Noise-Contrastive Estimation — the foundational loss function for modern contrastive learning and embedding models.',
                                icon: Sparkles,
                                isLeaf: false,
                                duration: '6h',
                                level: 'Advanced',
                                children: [
                                    { id: 'infonce-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-5', label: 'Module 5', description: 'Module 5 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'infonce-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'infonce-module-8', label: 'Module 8', description: 'Module 8 content.', icon: Code2, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'infonce-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'infonce-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'infonce-module-11', label: 'Module 11', description: 'Module 11 content.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                                ]
                            },
                            {
                                id: 'rag-ingestion-mfp',
                                label: 'MFP',
                                description: 'Multi-Feature Parsing — advanced pipelines for extracting and integrating diverse document structure features.',
                                icon: Layers,
                                isLeaf: false,
                                duration: '2h',
                                level: 'Advanced',
                                children: [
                                    { id: 'mfp-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'mfp-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'mfp-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'mfp-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                                    { id: 'mfp-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Advanced' },
                                ]
                            },
                            {
                                id: 'rag-ingestion-vmi',
                                label: 'VMI',
                                description: 'Vision Mamba — state-of-the-art state space models (SSMs) for efficient, high-resolution visual feature extraction.',
                                icon: Zap,
                                isLeaf: false,
                                duration: '2h',
                                level: 'Expert',
                                children: [
                                    { id: 'vmi-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'vmi-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'vmi-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Advanced' },
                                    { id: 'vmi-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Expert' },
                                ]
                            },
                        ],
                    },
                    {
                        id: 'rag-quantisation',
                        label: 'Quantisation',
                        description: 'Model quantisation techniques for efficient inference and deployment.',
                        icon: Cpu,
                        isLeaf: false,
                        duration: '30m',
                        level: 'Intermediate',
                        children: [
                            { id: 'quant-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'quant-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'quant-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'quant-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                        ],
                    },
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
                tag: 'Deep Dive',
                tagColor: '#06b6d4',
                children: [
                    {
                        id: 'mrag-agentic-ai',
                        label: 'Agentic AI',
                        description: 'Build agentic multimodal RAG workflows with tool-use, planning, and iterative reasoning.',
                        icon: Cpu,
                        isLeaf: false,
                        duration: '4h',
                        level: 'Intermediate',
                        children: [
                            { id: 'mrag-agentic-ai-module-1', label: 'Module 1', description: 'Data formats and representations for agentic pipelines.', icon: FileText, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'mrag-agentic-ai-module-2', label: 'Module 2', description: 'JSON schema design and validation for structured outputs.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'mrag-agentic-ai-module-3', label: 'Module 3', description: 'XML + Markdown patterns for robust tool I/O.', icon: ScanText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-agentic-ai-module-4', label: 'Module 4', description: 'BAML and Pydantic: typed, reliable LLM outputs.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-agentic-ai-module-5', label: 'Module 5', description: 'Jinja2 templating for prompts and structured generation.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-agentic-ai-module-6', label: 'Module 6', description: 'CI/CD and deployment basics for agentic systems.', icon: ServerCog, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'mrag-multiagent',
                        label: 'Multiagent',
                        description: 'Design multi-agent multimodal systems for collaboration, routing, and orchestration.',
                        icon: GitBranch,
                        isLeaf: false,
                        duration: '6h',
                        level: 'Intermediate',
                        children: [
                            { id: 'mrag-multiagent-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'mrag-multiagent-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'mrag-multiagent-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-multiagent-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-multiagent-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-multiagent-module-5', label: 'Module 5', description: 'Module 5 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'mrag-multiagent-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-11', label: 'Module 11', description: 'Module 11 content.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-12', label: 'Module 12', description: 'Module 12 content.', icon: Lock, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'mrag-multiagent-module-13', label: 'Module 13', description: 'Module 13 content.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'mrag-evaluation',
                        label: 'Evaluation',
                        description: 'Evaluate multimodal RAG systems with comprehensive metrics and benchmarks.',
                        icon: FlaskConical,
                        isLeaf: false,
                        duration: '40m',
                        level: 'Intermediate',
                        children: [
                            { id: 'eval-module-0', label: 'Module 0', description: 'Module 0 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'eval-module-1', label: 'Module 1', description: 'Module 1 content.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'eval-module-2', label: 'Module 2', description: 'Module 2 content.', icon: Search, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'eval-module-3', label: 'Module 3', description: 'Module 3 content.', icon: Database, isLeaf: true, duration: '30m', level: 'Beginner' },
                            { id: 'eval-module-4', label: 'Module 4', description: 'Module 4 content.', icon: FileText, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-5', label: 'Module 5', description: 'Module 5 content.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-6', label: 'Module 6', description: 'Module 6 content.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-7', label: 'Module 7', description: 'Module 7 content.', icon: Globe, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-8', label: 'Module 8', description: 'Module 8 content.', icon: Code2, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-9', label: 'Module 9', description: 'Module 9 content.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'eval-module-10', label: 'Module 10', description: 'Module 10 content.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-module-11', label: 'Module 11', description: 'Module 11 content.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-module-12', label: 'Module 12', description: 'Module 12 content.', icon: FlaskConical, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-module-13', label: 'Module 13', description: 'Module 13 content.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-module-14', label: 'Module 14', description: 'Module 14 content.', icon: ServerCog, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-module-15', label: 'Module 15', description: 'Module 15 content.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'eval-genai-reference', label: 'GenAI Evaluation Reference', description: 'Comprehensive reference for GenAI evaluation methodologies.', icon: Brain, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                ],
            },
            {
                id: 'mcp',
                label: 'MCP',
                description: 'Model Context Protocol — standardizing how AI applications connect with data sources and tools.',
                icon: Cpu,
                gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                lineGradient: 'from-indigo-500 via-purple-500 to-cyan-500',
                tag: 'New 🔥',
                tagColor: '#ef4444',
                isLeaf: true,
                duration: '4h',
                level: 'Intermediate',
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
                id: 'statistics-probability',
                label: 'Statistics and Probability',
                description: 'Learn descriptive statistics, distributions, hypothesis testing, and probability fundamentals for data science.',
                icon: FlaskConical,
                gradient: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                lineGradient: 'from-sky-500 via-cyan-500 to-teal-500',
                tag: 'Core',
                tagColor: '#0ea5e9',
                isLeaf: false,
                duration: '8h',
                level: 'Beginner',
                children: [
                    { id: 'module_1_1', label: 'Module 1.1', description: 'Statistics & Probability Module 1.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_2', label: 'Module 1.2', description: 'Statistics & Probability Module 1.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_3', label: 'Module 1.3', description: 'Statistics & Probability Module 1.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_4', label: 'Module 1.4', description: 'Statistics & Probability Module 1.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_5', label: 'Module 1.5', description: 'Statistics & Probability Module 1.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_6', label: 'Module 1.6', description: 'Statistics & Probability Module 1.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_1_7', label: 'Module 1.7', description: 'Statistics & Probability Module 1.7', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_1', label: 'Module 2.1', description: 'Statistics & Probability Module 2.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_2', label: 'Module 2.2', description: 'Statistics & Probability Module 2.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_3', label: 'Module 2.3', description: 'Statistics & Probability Module 2.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_4', label: 'Module 2.4', description: 'Statistics & Probability Module 2.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_5', label: 'Module 2.5', description: 'Statistics & Probability Module 2.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_6', label: 'Module 2.6', description: 'Statistics & Probability Module 2.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_2_7', label: 'Module 2.7', description: 'Statistics & Probability Module 2.7', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_1', label: 'Module 3.1', description: 'Statistics & Probability Module 3.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_2', label: 'Module 3.2', description: 'Statistics & Probability Module 3.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_3', label: 'Module 3.3', description: 'Statistics & Probability Module 3.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_4', label: 'Module 3.4', description: 'Statistics & Probability Module 3.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_5', label: 'Module 3.5', description: 'Statistics & Probability Module 3.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_6', label: 'Module 3.6', description: 'Statistics & Probability Module 3.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_7', label: 'Module 3.7', description: 'Statistics & Probability Module 3.7', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_3_8', label: 'Module 3.8', description: 'Statistics & Probability Module 3.8', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_1', label: 'Module 4.1', description: 'Statistics & Probability Module 4.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_2', label: 'Module 4.2', description: 'Statistics & Probability Module 4.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_3', label: 'Module 4.3', description: 'Statistics & Probability Module 4.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_4', label: 'Module 4.4', description: 'Statistics & Probability Module 4.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_5', label: 'Module 4.5', description: 'Statistics & Probability Module 4.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_6', label: 'Module 4.6', description: 'Statistics & Probability Module 4.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_7', label: 'Module 4.7', description: 'Statistics & Probability Module 4.7', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_4_8', label: 'Module 4.8', description: 'Statistics & Probability Module 4.8', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_1', label: 'Module 5.1', description: 'Statistics & Probability Module 5.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_2', label: 'Module 5.2', description: 'Statistics & Probability Module 5.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_3', label: 'Module 5.3', description: 'Statistics & Probability Module 5.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_4', label: 'Module 5.4', description: 'Statistics & Probability Module 5.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_5', label: 'Module 5.5', description: 'Statistics & Probability Module 5.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_5_6', label: 'Module 5.6', description: 'Statistics & Probability Module 5.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_1', label: 'Module 6.1', description: 'Statistics & Probability Module 6.1', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_2', label: 'Module 6.2', description: 'Statistics & Probability Module 6.2', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_3', label: 'Module 6.3', description: 'Statistics & Probability Module 6.3', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_4', label: 'Module 6.4', description: 'Statistics & Probability Module 6.4', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_5', label: 'Module 6.5', description: 'Statistics & Probability Module 6.5', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'module_6_6', label: 'Module 6.6', description: 'Statistics & Probability Module 6.6', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                ],
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
                    { id: 'ml-module-1', label: 'Module 1', description: 'Introduction to Machine Learning concepts and foundations.', icon: BookOpen, isLeaf: true, duration: '2h', level: 'Beginner' },
                    { id: 'ml-module-2', label: 'Module 2', description: 'Supervised Learning: Regression and Classification techniques.', icon: Search, isLeaf: true, duration: '3h', level: 'Intermediate' },
                    { id: 'ml-module-3', label: 'Module 3', description: 'Unsupervised Learning and Model Evaluation strategies.', icon: Network, isLeaf: true, duration: '3h', level: 'Intermediate' },
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
                    { id: 'dl-module-0-1-why-deep-learning', label: 'Module 0.1', description: 'Why Deep Learning?', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'dl-module-0-2-tensors', label: 'Module 0.2', description: 'Tensors: the core data structure.', icon: Layers, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'dl-module-0-3-calculus-autograd', label: 'Module 0.3', description: 'Calculus + Autograd intuition.', icon: GitBranch, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'dl-module-0-4-cinematch-setup', label: 'Module 0.4', description: 'Cinematch setup and environment.', icon: ServerCog, isLeaf: true, duration: '30m', level: 'Beginner' },

                    { id: 'dl-module-1-1-linear-regression', label: 'Module 1.1', description: 'Linear regression foundations.', icon: Search, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'dl-module-1-2-loss-landscapes', label: 'Module 1.2', description: 'Loss landscapes and optimization intuition.', icon: Globe, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-1-3-classification', label: 'Module 1.3', description: 'Classification basics and decision boundaries.', icon: ScanEye, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-1-4-perceptron', label: 'Module 1.4', description: 'Perceptron and early neural networks.', icon: Brain, isLeaf: true, duration: '30m', level: 'Intermediate' },

                    { id: 'dl-module-2-1-mlp', label: 'Module 2.1', description: 'Multi-layer perceptrons (MLP).', icon: Network, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-2-2-backprop', label: 'Module 2.2', description: 'Backpropagation: how learning happens.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-2-3-pytorch-builder', label: 'Module 2.3', description: 'Build models with PyTorch.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-2-4-optimization-practice', label: 'Module 2.4', description: 'Optimization practice.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-2-5-optimization-theory', label: 'Module 2.5', description: 'Optimization theory.', icon: FlaskConical, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'dl-module-2-6-regularization', label: 'Module 2.6', description: 'Regularization and generalization.', icon: Lock, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-2-7-computational-performance', label: 'Module 2.7', description: 'Computational performance and efficiency.', icon: Clock, isLeaf: true, duration: '30m', level: 'Advanced' },

                    { id: 'dl-module-3-1-cnns', label: 'Module 3.1', description: 'Convolutional neural networks (CNNs).', icon: Image, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-3-2-cnn-architectures', label: 'Module 3.2', description: 'CNN architectures and design patterns.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-3-3-rnns', label: 'Module 3.3', description: 'Recurrent neural networks (RNNs).', icon: Code2, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-3-4-lstm-gru', label: 'Module 3.4', description: 'LSTM and GRU.', icon: Hash, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-3-5-capstone', label: 'Module 3.5', description: 'Capstone.', icon: GraduationCap, isLeaf: true, duration: '30m', level: 'Advanced' },

                    { id: 'dl-module-4-1-attention', label: 'Module 4.1', description: 'Attention mechanism.', icon: MousePointer2, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-4-2-transformer', label: 'Module 4.2', description: 'Transformer architecture.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-4-3-word2vec', label: 'Module 4.3', description: 'Word2Vec embeddings.', icon: ScanText, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-4-4-pretraining', label: 'Module 4.4', description: 'Pretraining and transfer learning.', icon: Star, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-4-5-gans', label: 'Module 4.5', description: 'GANs.', icon: Sparkles, isLeaf: true, duration: '30m', level: 'Advanced' },

                    { id: 'dl-module-5-1-gaussian-processes', label: 'Module 5.1', description: 'Gaussian processes.', icon: Globe, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-module-5-2-bayesian-hpo', label: 'Module 5.2', description: 'Bayesian hyperparameter optimization.', icon: Filter, isLeaf: true, duration: '30m', level: 'Advanced' },

                    { id: 'dl-capstone-phase-1-linear', label: 'Capstone Phase 1', description: 'Capstone phase 1: Linear.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'dl-capstone-phase-2-mlp', label: 'Capstone Phase 2', description: 'Capstone phase 2: MLP.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                ],
            },
            {
                id: 'pytorch',
                label: 'PyTorch',
                description: 'Tensors, autograd, neural network architectures, and model training with PyTorch.',
                icon: Cpu,
                gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                lineGradient: 'from-violet-500 via-purple-500 to-cyan-500',
                tag: 'Advanced',
                tagColor: '#8b5cf6',
                duration: '15h',
                isLeaf: false,
                children: [
                    { id: 'pytorch-tensors', label: 'Module 1: Tensors', description: 'PyTorch Module 1: Tensors', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'pytorch-autograd', label: 'Module 2: Autograd', description: 'PyTorch Module 2: Autograd', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'pytorch-neural-network', label: 'Module 3: Neural Network Module', description: 'PyTorch Module 3: nn.Module', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'pytorch-training-loop', label: 'Module 4: Training Loop', description: 'PyTorch Module 4: Training Loop', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'pytorch-data-pipeline', label: 'Module 5: Data Pipelines', description: 'PyTorch Module 5: Data Pipelines', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Beginner' },
                    { id: 'pytorch-evaluation', label: 'Module 6: Evaluation', description: 'PyTorch Module 6: Evaluation', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'pytorch-cnn', label: 'Module 7: CNNs', description: 'PyTorch Module 7: CNNs', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'pytorch-sequence-models', label: 'Module 8: Sequence Models', description: 'PyTorch Module 8: Sequence Models', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'pytorch-training-tricks', label: 'Module 9: Training Tricks', description: 'PyTorch Module 9: Training Tricks', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'pytorch-debugging', label: 'Module 10: Debugging', description: 'PyTorch Module 10: Debugging', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                    { id: 'pytorch-distributed', label: 'Module 11: Distributed Training', description: 'PyTorch Module 11: Distributed Training', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                    { id: 'pytorch-deployment', label: 'Module 12: Deployment', description: 'PyTorch Module 12: Deployment', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
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
            { id: 'clustering-part0', label: 'Part 0', description: 'Course overview, prerequisites, and environment setup for clustering.', icon: Layers, isLeaf: true, duration: '1h', level: 'Beginner' },
            { id: 'clustering-part1', label: 'Part 1', description: 'Introduction to clustering — core concepts, distance metrics, and problem formulation.', icon: BookOpen, isLeaf: true, duration: '1h 30m', level: 'Beginner' },
            { id: 'clustering-part2', label: 'Part 2', description: 'K-Means, K-Medoids, and centroid-based clustering with hands-on implementation.', icon: Cpu, isLeaf: true, duration: '2h', level: 'Intermediate' },
            { id: 'clustering-part3', label: 'Part 3', description: 'Hierarchical clustering, DBSCAN, and density-based methods for complex data shapes.', icon: Network, isLeaf: true, duration: '2h', level: 'Intermediate' },
            { id: 'clustering-part4', label: 'Part 4', description: 'Evaluation metrics, cluster validation, and real-world clustering project.', icon: FlaskConical, isLeaf: true, duration: '2h 30m', level: 'Advanced' },
            { id: 'clustering-part5', label: 'Part 5', description: 'Gaussian Mixture Models (GMM) and Expectation-Maximization algorithm in depth.', icon: Brain, isLeaf: true, duration: '2h', level: 'Advanced' },
            { id: 'clustering-part6', label: 'Part 6', description: 'Spectral clustering and graph-based clustering methods.', icon: Network, isLeaf: true, duration: '2h', level: 'Advanced' },
            { id: 'clustering-part7', label: 'Part 7', description: 'Dimensionality reduction techniques (PCA, t-SNE) paired with clustering.', icon: Sparkles, isLeaf: true, duration: '1h 30m', level: 'Advanced' },
            { id: 'clustering-part8', label: 'Part 8', description: 'Handling large-scale datasets and scalable clustering algorithms.', icon: ServerCog, isLeaf: true, duration: '2h', level: 'Expert' },
            { id: 'clustering-part9', label: 'Part 9', description: 'Time series clustering and sequence data grouping.', icon: Clock, isLeaf: true, duration: '1h 30m', level: 'Expert' },
            { id: 'clustering-part10', label: 'Part 10', description: 'Anomaly detection and outlier removal using unsupervised techniques.', icon: Search, isLeaf: true, duration: '2h', level: 'Advanced' },
            { id: 'clustering-part11', label: 'Part 11', description: 'Capstone project: building an end-to-end clustering pipeline in production.', icon: Code2, isLeaf: true, duration: '3h', level: 'Expert' },
        ],
    },
    {
        id: 'langgraph',
        label: 'LangGraph',
        description: 'Build stateful, multi-agent applications with LangGraph — the graph framework for agentic AI.',
        icon: GitBranch,
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #8b5cf6 100%)',
        lineGradient: 'from-pink-500 via-rose-500 to-violet-500',
        tag: 'New 🌟',
        tagColor: '#ec4899',
        children: [
            { id: 'langgraph-module-1', label: 'Module 1', description: 'Module 1 — Introduction and fundamentals.', icon: BookOpen, isLeaf: true, duration: '20m', level: 'Beginner' },
            { id: 'langgraph-module-2', label: 'Module 2', description: 'Module 2 — Core concepts and basics.', icon: Network, isLeaf: true, duration: '35m', level: 'Beginner' },
            { id: 'langgraph-module-3', label: 'Module 3', description: 'Module 3 — Building blocks and structures.', icon: Database, isLeaf: true, duration: '30m', level: 'Intermediate' },
            { id: 'langgraph-module-4', label: 'Module 4', description: 'Module 4 — Advanced patterns and techniques.', icon: Cpu, isLeaf: true, duration: '45m', level: 'Intermediate' },
            { id: 'langgraph-module-5', label: 'Module 5', description: 'Module 5 — Complex implementations.', icon: GitBranch, isLeaf: true, duration: '50m', level: 'Advanced' },
            { id: 'langgraph-module-6', label: 'Module 6', description: 'Module 6 — Optimization and scaling.', icon: ServerCog, isLeaf: true, duration: '40m', level: 'Advanced' },
            { id: 'langgraph-module-7', label: 'Module 7', description: 'Module 7 — Real-world applications.', icon: Zap, isLeaf: true, duration: '35m', level: 'Intermediate' },
            { id: 'langgraph-module-8', label: 'Module 8', description: 'Module 8 — Capstone and deployment.', icon: Code2, isLeaf: true, duration: '55m', level: 'Advanced' },
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
    const cardRef = useRef(null);
    const glareRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const Icon = node.icon ?? BookOpen;
    const isFolder = !node.isLeaf;
    const leafCount = isFolder ? countLeaves(node) : 0;
    const lvl = LEVEL_COLORS[node.level] ?? LEVEL_COLORS['Intermediate'];

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate dynamic rotation
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;
        
        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);

        // Create glare lighting effect tracking the cursor
        if (glareRef.current) {
            glareRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.12) 0%, transparent 50%)`;
        }
    };

    const handleMouseLeave = () => {
        setHovered(false);
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    return (
        <div
            ref={cardRef}
            className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${hovered ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                boxShadow: hovered ? '0 30px 60px rgba(0,0,0,0.12), 0 0 20px rgba(99,102,241,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: transform,
                transition: hovered ? 'box-shadow 0.3s ease, border 0.3s ease, transform 0.1s ease-out' : 'all 0.5s ease',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => isFolder ? onDrillDown(node) : onStartLeaf(node)}
        >
            {/* Dynamic Glare Overlay */}
            <div 
                ref={glareRef} 
                className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300 z-10" 
                style={{ opacity: hovered ? 1 : 0 }} 
            />
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
    const location = useLocation();
    // pathIds = array of node IDs from root to current folder
    const [pathIds, setPathIds] = useState(location.state?.pathIds || []);
    const [search, setSearch] = useState('');
    const [activeLevels, setActiveLevels] = useState([]);
    const [showLevelFilters, setShowLevelFilters] = useState(false);
    const searchRef = useRef(null);

    // Keyboard shortcut: Cmd/Ctrl+K → focus search
    React.useEffect(() => {
        const handler = e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const toggleLevel = level => {
        setActiveLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    // Recursive search in COURSE_TREE
    const findMatches = (nodes, query, levels) => {
        let results = [];
        for (const node of nodes) {
            const matchesQuery = query === '' || 
                node.label.toLowerCase().includes(query) || 
                (node.description && node.description.toLowerCase().includes(query)) ||
                (node.tag && node.tag.toLowerCase().includes(query));
            
            const matchesLevel = levels.length === 0 || levels.includes(node.level);

            if (matchesQuery && matchesLevel && node.isLeaf) {
                results.push(node);
            }
            if (node.children) {
                results = [...results, ...findMatches(node.children, query, levels)];
            }
        }
        return results;
    };

    const filteredResults = React.useMemo(() => {
        if (!search.trim() && activeLevels.length === 0) return null;
        return findMatches(COURSE_TREE, search.toLowerCase(), activeLevels);
    }, [search, activeLevels]);

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
        navigate(`/course/${node.id}`, { state: { fromPathIds: pathIds } });
    };

    const currentItems = getCurrentItems();
    const breadcrumbs = getBreadcrumbs();
    const totalAllLessons = COURSE_TREE.reduce((s, n) => s + countLeaves(n), 0);

    return (
        <div className="min-h-screen w-full overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>
            
            <style>{`
                @keyframes searchGradientTracer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .search-focus:focus { outline:none; }
            `}</style>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">

                {/* ── Home-level header — dark hero matching Projects page ── */}
                {!pathIds.length && (
                    <header className="mb-10">
                        {/* Dark hero banner */}
                        <div style={{
                            position: 'relative', overflow: 'hidden',
                            background: '#09090f',
                            borderRadius: 24,
                            padding: '52px 24px 46px',
                            marginBottom: 0,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {/* Left glow — teal */}
                            <div style={{
                                position: 'absolute', top: '50%', left: -140, transform: 'translateY(-50%)',
                                width: 400, height: 400, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 65%)',
                                filter: 'blur(70px)', pointerEvents: 'none',
                            }} />
                            {/* Right glow — indigo */}
                            <div style={{
                                position: 'absolute', top: '50%', right: -140, transform: 'translateY(-50%)',
                                width: 360, height: 360, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 65%)',
                                filter: 'blur(70px)', pointerEvents: 'none',
                            }} />

                            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                {/* Pill badge */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    padding: '5px 14px', borderRadius: 999,
                                    background: 'rgba(255,255,255,0.055)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontSize: '0.68rem', fontWeight: 700,
                                    color: 'rgba(255,255,255,0.5)',
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    marginBottom: 20,
                                    backdropFilter: 'blur(8px)',
                                }}>
                                    <GraduationCap size={10} style={{ color: '#06b6d4' }} />
                                    Structured Curriculum
                                </div>

                                <h1 style={{
                                    margin: '0 0 14px',
                                    fontSize: 'clamp(2rem, 5vw, 2.9rem)',
                                    fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
                                    color: '#ffffff',
                                }}>
                                    Course Library
                                </h1>

                                <p style={{
                                    margin: '0 auto 28px',
                                    fontSize: '0.95rem',
                                    color: 'rgba(255,255,255,0.38)',
                                    lineHeight: 1.7, maxWidth: 460,
                                }}>
                                    Explore structured learning paths — from Python basics to production AI systems.
                                </p>

                                {/* Stat chips */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {[
                                        { icon: <Layers size={13} />,       label: `${COURSE_TREE.length} Categories` },
                                        { icon: <BookOpen size={13} />,     label: `${totalAllLessons} Lessons` },
                                        { icon: <Sparkles size={13} />,    label: 'All Levels' },
                                        { icon: <Zap size={13} />,         label: 'New Courses Weekly' },
                                    ].map(({ icon, label }) => (
                                        <div key={label} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '6px 14px', borderRadius: 999,
                                            background: 'rgba(255,255,255,0.055)',
                                            border: '1px solid rgba(255,255,255,0.09)',
                                            fontSize: '0.76rem', fontWeight: 600,
                                            color: 'rgba(255,255,255,0.6)',
                                            backdropFilter: 'blur(8px)',
                                        }}>
                                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* ── Filter Bar (Sticky) ── */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    margin: '0 -16px 24px', padding: '12px 16px',
                    background: 'rgba(var(--color-app-bg-rgb, 10, 10, 15), 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <div className="max-w-6xl mx-auto flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            {/* Search Input with Gradient Tracer */}
                            <div style={{
                                flex: 1, padding: '1.5px', borderRadius: 14,
                                background: search ? 'linear-gradient(90deg, #6366f1, #06b6d4, #8b5cf6, #06b6d4, #6366f1)' : 'var(--color-border)',
                                backgroundSize: '300% 300%',
                                animation: search ? 'searchGradientTracer 3s linear infinite' : 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: search ? '0 8px 32px -8px rgba(6,182,212,0.3)' : 'none',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: 'var(--color-app-bg)', borderRadius: 13,
                                    padding: '10px 16px',
                                }}>
                                    <Search size={18} style={{ color: search ? '#06b6d4' : 'var(--color-muted-text)', transition: 'color 0.3s' }} />
                                    <input
                                        ref={searchRef}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search courses, modules, skills... (Ctrl+K)"
                                        className="search-focus flex-1 bg-transparent border-none text-sm font-medium focus:ring-0"
                                        style={{ color: 'var(--color-primary-text)' }}
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="p-1 hover:bg-red-500/10 rounded-full text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Level Filter Toggle */}
                            <button
                                onClick={() => setShowLevelFilters(!showLevelFilters)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    background: showLevelFilters ? 'rgba(99,102,241,0.1)' : 'var(--color-surface)',
                                    border: `1px solid ${showLevelFilters ? '#6366f1' : 'var(--color-border)'}`,
                                    color: showLevelFilters ? '#6366f1' : 'var(--color-muted-text)',
                                }}
                            >
                                <Filter size={16} />
                                <span className="hidden sm:inline">Levels</span>
                                {activeLevels.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-500 text-white text-[10px]">{activeLevels.length}</span>}
                            </button>
                        </div>

                        {/* Level Filter Chips */}
                        {showLevelFilters && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                {Object.keys(LEVEL_COLORS).map(level => {
                                    const isActive = activeLevels.includes(level);
                                    const colors = LEVEL_COLORS[level];
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => toggleLevel(level)}
                                            className="px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all"
                                            style={{
                                                background: isActive ? colors.bg.replace('0.12', '0.25') : 'var(--color-surface)',
                                                border: `1px solid ${isActive ? colors.color : 'var(--color-border)'}`,
                                                color: isActive ? colors.color : 'var(--color-muted-text)',
                                            }}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                                {activeLevels.length > 0 && (
                                    <button
                                        onClick={() => setActiveLevels([])}
                                        className="px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-all border border-transparent"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Breadcrumb (when inside a folder and not searching) ── */}
                {pathIds.length > 0 && !filteredResults && (
                    <Breadcrumb path={breadcrumbs} onNavigate={handleNavigate} />
                )}

                {/* ── Root category hero (shown when drilling into a category and not searching) ── */}
                {isInsideRootCategory && rootCatNode && !filteredResults && (
                    <RootCategoryHero node={rootCatNode} />
                )}

                {/* ── Section title for sub-folders (not searching) ── */}
                {parentNode && !isInsideRootCategory && !filteredResults && (
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
                {filteredResults ? (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Search size={18} className="text-indigo-500" />
                                Search Results ({filteredResults.length})
                            </h3>
                            <button onClick={() => { setSearch(''); setActiveLevels([]); }} className="text-sm text-indigo-500 hover:underline font-semibold">
                                Clear search
                            </button>
                        </div>
                        {filteredResults.length === 0 ? (
                            <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed var(--color-border)', background: 'rgba(99,102,241,0.03)' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Search size={28} className="text-muted-text" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No matches found</h3>
                                <p style={{ color: 'var(--color-muted-text)', fontSize: '0.9rem' }}>Try different keywords or check your level filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredResults.map(node => (
                                    <CourseCard
                                        key={node.id}
                                        node={node}
                                        onDrillDown={handleDrillDown}
                                        onStartLeaf={handleStartLeaf}
                                        isRootCategory={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : currentItems.length === 0 ? (
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
