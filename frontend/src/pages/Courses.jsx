import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronRight, Play, BookOpen, Layers, Brain,
    Database, FileText, Search, Zap, Globe, Code2,
    Cpu, GitBranch, FlaskConical, Video, Image, ScanText,
    Hash, Network, ServerCog, Sparkles, Home, ArrowLeft,
    Clock, Star, Lock, GraduationCap, Filter, X, ScanEye, MousePointer2
} from 'lucide-react';

//  COURSE DATA TREE
//  isLeaf = true → navigates to course content

const COURSE_TREE_BASE = [
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
                        category: 'Agentic AI',
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
                id: 'transformer',
                label: 'Transformer',
                description: 'Master the Transformer architecture — attention, positional encoding, BERT, GPT, and beyond.',
                icon: Cpu,
                gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                lineGradient: 'from-amber-500 via-orange-500 to-red-500',
                tag: 'Advanced',
                tagColor: '#f59e0b',
                duration: '12h',
                isLeaf: false,
                children: [
                    {
                        id: 'transformer-module-0', label: 'Module 0', description: 'Foundations — attention refresher and the core transformer block.', icon: BookOpen, isLeaf: false, duration: '1h', level: 'Intermediate',
                        children: [
                            { id: 'transformer-0-1', label: '0.1 Attention Refresher', description: 'Review of attention mechanisms before diving into transformers.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'transformer-0-2', label: '0.2 Transformer Block', description: 'Anatomy of a single transformer block end-to-end.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                        ],
                    },
                    {
                        id: 'transformer-module-1', label: 'Module 1', description: 'Encoder models — BERT, RoBERTa, DistilBERT/ALBERT, and DeBERTa/ELECTRA.', icon: Brain, isLeaf: false, duration: '2h', level: 'Intermediate',
                        children: [
                            { id: 'transformer-1-1', label: '1.1 BERT', description: 'Bidirectional pre-training with masked language modelling.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'transformer-1-2', label: '1.2 RoBERTa', description: 'Robustly optimised BERT pre-training approach.', icon: Layers, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'transformer-1-3', label: '1.3 DistilBERT & ALBERT', description: 'Knowledge distillation and parameter-efficient BERT variants.', icon: Zap, isLeaf: true, duration: '30m', level: 'Intermediate' },
                            { id: 'transformer-1-4', label: '1.4 DeBERTa & ELECTRA', description: 'Disentangled attention and replaced-token detection pre-training.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-2', label: 'Module 2', description: 'Decoder models — GPT-2, GPT-3/ICL, InstructGPT/RLHF, and GPT-4 scaling.', icon: Sparkles, isLeaf: false, duration: '2h', level: 'Advanced',
                        children: [
                            { id: 'transformer-2-1', label: '2.1 GPT-2', description: 'Autoregressive language modelling and zero-shot capabilities.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-2-2', label: '2.2 GPT-3 & ICL', description: 'In-context learning and few-shot prompting at scale.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-2-3', label: '2.3 InstructGPT & RLHF', description: 'Aligning language models with human feedback.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-2-4', label: '2.4 GPT-4 & Scaling', description: 'Scaling laws, multimodality, and frontier model design.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-3', label: 'Module 3', description: 'Open-weight LLMs — LLaMA, Mistral/Mixtral, and Qwen.', icon: Globe, isLeaf: false, duration: '1h 30m', level: 'Advanced',
                        children: [
                            { id: 'transformer-3-1', label: '3.1 LLaMA', description: 'Meta\'s open foundation model family and design choices.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-3-2', label: '3.2 Mistral & Mixtral', description: 'Sliding-window attention and mixture-of-experts decoding.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-3-3', label: '3.3 Qwen', description: 'Alibaba\'s multilingual open LLM series.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-4', label: 'Module 4', description: 'Seq2seq models — T5/FLAN and BART.', icon: FileText, isLeaf: false, duration: '1h', level: 'Advanced',
                        children: [
                            { id: 'transformer-4-1', label: '4.1 T5 & FLAN', description: 'Text-to-text transfer transformer and instruction tuning.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-4-2', label: '4.2 BART', description: 'Denoising sequence-to-sequence pre-training for generation.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-5', label: 'Module 5', description: 'Efficient attention — quadratic bottleneck, Longformer/BigBird, and linear attention.', icon: Zap, isLeaf: false, duration: '1h 30m', level: 'Advanced',
                        children: [
                            { id: 'transformer-5-1', label: '5.1 Quadratic Bottleneck', description: 'Understanding the O(n²) cost of standard self-attention.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-5-2', label: '5.2 Longformer & BigBird', description: 'Sparse attention patterns for long-sequence modelling.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-5-3', label: '5.3 Linear Attention', description: 'Kernel-based approximations for sub-quadratic attention.', icon: Zap, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-6', label: 'Module 6', description: 'Vision transformers — ViT/DeiT, Swin, CLIP, and multimodal LLMs.', icon: Image, isLeaf: false, duration: '2h', level: 'Advanced',
                        children: [
                            { id: 'transformer-6-1', label: '6.1 ViT & DeiT', description: 'Applying transformers to image patches with distillation.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-6-2', label: '6.2 Swin', description: 'Hierarchical vision transformer with shifted windows.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-6-3', label: '6.3 CLIP', description: 'Contrastive language-image pre-training.', icon: Search, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-6-4', label: '6.4 Multimodal LLMs', description: 'Unified models over text, images, and beyond.', icon: Network, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
                    {
                        id: 'transformer-module-7', label: 'Module 7', description: 'Advanced topics — MoE, SSMs, and production deployment.', icon: Cpu, isLeaf: false, duration: '1h 30m', level: 'Advanced',
                        children: [
                            { id: 'transformer-7-1', label: '7.1 Mixture of Experts', description: 'Sparse MoE routing for scalable model capacity.', icon: BookOpen, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-7-2', label: '7.2 SSMs', description: 'State space models as an alternative to attention.', icon: Layers, isLeaf: true, duration: '30m', level: 'Advanced' },
                            { id: 'transformer-7-3', label: '7.3 Production Stack', description: 'Serving, quantisation, and deploying transformers at scale.', icon: Cpu, isLeaf: true, duration: '30m', level: 'Advanced' },
                        ],
                    },
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
            {
                id: 'clustering-part1',
                label: 'Part 1',
                description: 'Core clustering modules (0-11).',
                icon: Layers,
                children: [
                    { id: 'clustering-module0', label: 'Module 0', description: 'Course overview, prerequisites, and environment setup for clustering.', icon: Layers, isLeaf: true, duration: '1h', level: 'Beginner' },
                    { id: 'clustering-module1', label: 'Module 1', description: 'Introduction to clustering — core concepts, distance metrics, and problem formulation.', icon: BookOpen, isLeaf: true, duration: '1h 30m', level: 'Beginner' },
                    { id: 'clustering-module2', label: 'Module 2', description: 'K-Means, K-Medoids, and centroid-based clustering with hands-on implementation.', icon: Cpu, isLeaf: true, duration: '2h', level: 'Intermediate' },
                    { id: 'clustering-module3', label: 'Module 3', description: 'Hierarchical clustering, DBSCAN, and density-based methods for complex data shapes.', icon: Network, isLeaf: true, duration: '2h', level: 'Intermediate' },
                    { id: 'clustering-module4', label: 'Module 4', description: 'Evaluation metrics, cluster validation, and real-world clustering project.', icon: FlaskConical, isLeaf: true, duration: '2h 30m', level: 'Advanced' },
                    { id: 'clustering-module5', label: 'Module 5', description: 'Gaussian Mixture Models (GMM) and Expectation-Maximization algorithm in depth.', icon: Brain, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module6', label: 'Module 6', description: 'Spectral clustering and graph-based clustering methods.', icon: Network, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module7', label: 'Module 7', description: 'Dimensionality reduction techniques (PCA, t-SNE) paired with clustering.', icon: Sparkles, isLeaf: true, duration: '1h 30m', level: 'Advanced' },
                    { id: 'clustering-module8', label: 'Module 8', description: 'Handling large-scale datasets and scalable clustering algorithms.', icon: ServerCog, isLeaf: true, duration: '2h', level: 'Expert' },
                    { id: 'clustering-module9', label: 'Module 9', description: 'Time series clustering and sequence data grouping.', icon: Clock, isLeaf: true, duration: '1h 30m', level: 'Expert' },
                    { id: 'clustering-module10', label: 'Module 10', description: 'Anomaly detection and outlier removal using unsupervised techniques.', icon: Search, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module11', label: 'Module 11', description: 'Capstone project: building an end-to-end clustering pipeline in production.', icon: Code2, isLeaf: true, duration: '3h', level: 'Expert' },
                ],
            },
            {
                id: 'clustering-part2',
                label: 'Part 2',
                description: 'Additional clustering content.',
                icon: Layers,
                children: [
                    { id: 'clustering-module12', label: 'Module 12', description: 'Advanced clustering module 12.', icon: Layers, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module13', label: 'Module 13', description: 'Advanced clustering module 13.', icon: BookOpen, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module14', label: 'Module 14', description: 'Advanced clustering module 14.', icon: Search, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module15', label: 'Module 15', description: 'Advanced clustering module 15.', icon: FlaskConical, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module16', label: 'Module 16', description: 'Advanced clustering module 16.', icon: Cpu, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module17', label: 'Module 17', description: 'Advanced clustering module 17.', icon: Network, isLeaf: true, duration: '2h', level: 'Advanced' },
                    { id: 'clustering-module18', label: 'Module 18', description: 'Advanced clustering module 18.', icon: Brain, isLeaf: true, duration: '2h', level: 'Expert' },
                    { id: 'clustering-module19', label: 'Module 19', description: 'Advanced clustering module 19.', icon: Sparkles, isLeaf: true, duration: '2h', level: 'Expert' },
                    { id: 'clustering-module20', label: 'Module 20', description: 'Advanced clustering module 20.', icon: ServerCog, isLeaf: true, duration: '2h', level: 'Expert' },
                    { id: 'clustering-module21', label: 'Module 21', description: 'Advanced clustering module 21.', icon: Code2, isLeaf: true, duration: '2h', level: 'Expert' },
                ],
            },
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

//  HELPERS

const PROMOTED_DATA_SCIENCE_IDS = new Set([
    'ds-python',
    'statistics-probability',
    'transformer',
    'deep-learning',
    'pytorch',
]);

const COURSE_TREE = COURSE_TREE_BASE.flatMap(node => {
    if (node.id !== 'data-science') return [node];

    const promotedCourses = node.children.filter(child => PROMOTED_DATA_SCIENCE_IDS.has(child.id));
    const remainingChildren = node.children.filter(child => !PROMOTED_DATA_SCIENCE_IDS.has(child.id));

    return [
        { ...node, children: remainingChildren },
        ...promotedCourses,
    ];
});

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

//  COURSE CARD — both branch (folder) & leaf

function CourseCard({ node, onDrillDown, onStartLeaf }) {
    const cardRef = useRef(null);
    const glareRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const Icon = node.icon ?? BookOpen;
    const isFolder = !node.isLeaf;
    const leafCount = isFolder ? countLeaves(node) : 0;
    const lvl = LEVEL_COLORS[node.level] ?? LEVEL_COLORS['Intermediate'];
    
    // Check if this is an Agentic AI module with IPYNB support
    const hasDepthContent = node.id && (
        node.id === 'mrag-agentic-ai-module-1' ||
        node.id === 'mrag-agentic-ai-module-2' ||
        node.id === 'mrag-agentic-ai-module-3' ||
        node.id === 'mrag-agentic-ai-module-4' ||
        node.id === 'mrag-agentic-ai-module-5' ||
        node.id === 'mrag-agentic-ai-module-6'
    );

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

                {/* Category tag */}
                {node.category && (
                    <span style={{
                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                        textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.25)', alignSelf: 'flex-start',
                    }}>
                        {node.category}
                    </span>
                )}

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

                    {/* CTA button(s) - dual buttons for Agentic AI modules */}
                    {!isFolder && hasDepthContent ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartLeaf(node, 'conceptual');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                                style={{
                                    background: 'var(--color-surface-hover)',
                                    color: 'var(--color-primary-text)',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#06b6d4)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--color-surface-hover)';
                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <FileText size={13} /> Conceptual
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartLeaf(node, 'depth');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                                style={{
                                    background: 'var(--color-surface-hover)',
                                    color: 'var(--color-primary-text)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg,#4f46e5,#6366f1)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--color-surface-hover)';
                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <BookOpen size={13} /> Depth
                            </button>
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}

//  ROOT CATEGORY HERO (top-level section header)

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

//  BREADCRUMB

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

//  MAIN PAGE

export default function Courses() {
    const navigate = useNavigate();
    const location = useLocation();
    // pathIds = array of node IDs from root to current folder
    const [pathIds, setPathIds] = useState(location.state?.pathIds || []);
    const [search, setSearch] = useState('');
    const [activeLevels, setActiveLevels] = useState([]);
    const [showLevelFilters, setShowLevelFilters] = useState(false);
    const searchRef = useRef(null);

    const urlPathIds = React.useMemo(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments[0] !== 'courses' || segments.length < 2) return [];
        return segments.slice(1);
    }, [location.pathname]);

    useEffect(() => {
        if (urlPathIds.length > 0) {
            setPathIds(urlPathIds);
            return;
        }

        setPathIds(location.state?.pathIds || []);
    }, [location.pathname, location.state, urlPathIds]);

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

    const syncCourseUrl = (ids) => {
        const nextPath = ids.length ? `/courses/${ids.join('/')}` : '/courses';
        navigate(nextPath, { state: { pathIds: ids } });
    };

    const handleDrillDown = (node) => {
        const nextIds = [...pathIds, node.id];
        setPathIds(nextIds);
        syncCourseUrl(nextIds);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNavigate = (ids) => {
        setPathIds(ids);
        syncCourseUrl(ids);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartLeaf = (node, format = 'conceptual') => {
        navigate(`/course/${node.id}`, { state: { fromPathIds: pathIds, format } });
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
                @keyframes heroPulse {
                    0%,100% { opacity:0.55; transform:scale(1); }
                    50%     { opacity:0.75; transform:scale(1.06); }
                }
                @keyframes heroGlow {
                    0%,100% { opacity:0.4; transform:scale(1) translateY(0); }
                    50%     { opacity:0.65; transform:scale(1.08) translateY(-8px); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                .courses-hero-title-grad {
                    background: linear-gradient(135deg, #fff 0%, #e0e7ff 35%, #a5f3fc 65%, #818cf8 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 6s linear infinite;
                }
                .courses-stat-card { transition: transform 0.2s, border-color 0.2s; }
                .courses-stat-card:hover { transform: translateY(-2px); border-color: rgba(99,102,241,0.35) !important; }
                .search-focus:focus { outline:none; }
            `}</style>

            {/* Hero Section — full-width, outside container */}
            {!pathIds.length && (
                <div className="relative overflow-hidden border-b bg-white dark:bg-black border-black/[0.06] dark:border-white/[0.06]" style={{minHeight:'340px'}}>
                    {/* Centre top glow */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full pointer-events-none" style={{background:'radial-gradient(ellipse,rgba(99,102,241,0.28) 0%,transparent 70%)',filter:'blur(60px)',animation:'heroGlow 8s ease-in-out infinite'}} />
                    {/* Teal glow left */}
                    <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(6,182,212,0.45) 0%,transparent 65%)',filter:'blur(80px)',animation:'heroPulse 7s ease-in-out infinite'}} />
                    {/* Indigo glow right */}
                    <div className="absolute top-1/2 -right-32 -translate-y-1/2 w-[360px] h-[360px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 65%)',filter:'blur(80px)',animation:'heroPulse 9s ease-in-out 1.5s infinite'}} />

                    <div className="relative z-10 text-center px-6 pt-12 pb-10 max-w-4xl mx-auto">
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

                        <h1 className="text-5xl md:text-[3.75rem] font-black tracking-tight leading-none courses-hero-title-grad mb-3">
                            Course Library
                        </h1>

                        <p style={{ margin: '0 auto 28px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, maxWidth: 460 }}>
                            Explore structured learning paths — from Python basics to production AI systems.
                        </p>

                        {/* Stat chips */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                { icon: <Layers size={13} />,    label: `${COURSE_TREE.length} Categories` },
                                { icon: <BookOpen size={13} />,  label: `${totalAllLessons} Lessons` },
                                { icon: <Sparkles size={13} />,  label: 'All Levels' },
                                { icon: <Zap size={13} />,       label: 'New Courses Weekly' },
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
                                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>{icon}</span>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 py-8 sm:py-12" style={{ width: '70%', margin: '0 auto' }}>

                {/* Breadcrumb (when inside a folder and not searching) */}
                {pathIds.length > 0 && !filteredResults && (
                    <Breadcrumb path={breadcrumbs} onNavigate={handleNavigate} />
                )}

                {/* Root category hero (shown when drilling into a category and not searching) */}
                {isInsideRootCategory && rootCatNode && !filteredResults && (
                    <RootCategoryHero node={rootCatNode} />
                )}

                {/* Section title for sub-folders (not searching) */}
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

                {/* Cards Grid */}
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
