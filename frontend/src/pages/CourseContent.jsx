import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  Maximize2,
  Minimize2,
  Zap,
  ArrowLeft,
  Brain,
  Award,
  Menu,
  Dot,
  StickyNote,
  Edit3,
  Trash2,
  X,
} from "lucide-react";

import ReactDOM from 'react-dom';
import parse, { domToReact } from 'html-react-parser';
import InteractiveCodeBlock from '../components/InteractiveCodeBlock';
import QuizModal from '../components/QuizModal';
/* ── Zoomable Image Component — rendered via Portal so it truly covers everything ── */
const ZoomableImage = ({ src, alt }) => {
  const [zoomed, setZoomed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!zoomed) return;
    const handler = (e) => { if (e.key === 'Escape') setZoomed(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomed]);

  const isDark = document.documentElement.classList.contains('dark');
  const imgFilter = isDark ? 'invert(1) hue-rotate(180deg)' : 'none';

  const overlay = zoomed ? ReactDOM.createPortal(
    <div
      onClick={() => setZoomed(false)}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 2147483647,
        cursor: 'zoom-out',
        padding: '24px',
      }}
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          filter: imgFilter,
        }}
      />
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '32px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Press Esc or click to close
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="zoomable"
        onClick={() => setZoomed(true)}
      />
      {overlay}
    </>
  );
};

/* ── Performance Optimization: Memoized HTML Content ── */
const MemoizedProseContent = memo(({ html, innerRef }) => {
  // Supported IDE tag names → language id
  const IDE_TAGS = { python: 'python', sql: 'sql', code: 'code', javascript: 'javascript' };

  const getText = (node) => {
    if (node.type === 'text') return node.data;
    if (node.children) return node.children.map(getText).join('');
    return '';
  };

  const options = {
    replace: (domNode) => {
      // 1. Handle IDE Tags (matches actual <python> tags)
      const lang = IDE_TAGS[domNode.name];
      if (lang) {
        const codeContent = (domNode.children || []).map(getText).join('').trim();
        return <InteractiveCodeBlock initialCode={codeContent} language={lang} key={codeContent.slice(0, 20)} />;
      }

      // 2. Clear out raw marker strings that were converted to text (e.g. <python> or </python>)
      // This often happens in mammoth conversion when using text-based markers.
      if (domNode.type === 'tag' && domNode.name === 'p') {
        const text = getText(domNode).trim().toLowerCase();
        const isMarker = text === '<python>' || text === '</python>' || 
                        text === '<code>' || text === '</code>' ||
                        text === '<sql>' || text === '</sql>';
        if (isMarker) return <></>; // Don't render marker-only paragraphs
      }

      // 3. Handle Zoomable Images
      if (domNode.name === 'img') {
        const { src, alt } = domNode.attribs;
        return <ZoomableImage src={src} alt={alt || 'Course graphic'} key={src?.slice(0, 30)} />;
      }
    }
  };

  return (
    <div
      ref={innerRef}
      className="prose-content prose-card selectable-text"
    >
      {parse(html, options)}
    </div>
  );
});
// Only re-render if the direct HTML string changes
MemoizedProseContent.displayName = "MemoizedProseContent";

/**
 * LESSONS data structure — backend-ready shape.
 * When you connect to the API, just replace this array with the API response.
 * Expected shape per lesson:
 * {
 *   id: number | string,          // unique lesson ID
 *   title: string,
 *   duration: string,
 *   type: "Theory" | "Practice" | "Project",
 *   completed: boolean,
 *   subTopics: [                   // optional — array of sub-sections in this lesson
 *     { id: string, title: string, completed: boolean }
 *   ]
 * }
 */
/**
 * Map a courseId (built from category + index in Courses.jsx) to a
 * pre-converted HTML file sitting in /public/courses/.
 */
const COURSE_HTML_MAP = {
  "prompt-engineering-0": "/courses/Prompt_Engineering_Moduless.html",
  "video-processing-0": "/courses/videoingestion.html",
  "vectorless-rag": "/courses/videoingestion.html",
  "docformer": "/cources/generative-ai/RAG/document-ingestion/docformer_enhanced.html",
  "doc-to-image": "/cources/generative-ai/RAG/document-ingestion/document_to_image.html",
  "infonce": "/cources/generative-ai/RAG/document-ingestion/InfoNCE.html",
  "max-seq": "/cources/generative-ai/RAG/document-ingestion/maxiamal_sequential_pattern.html",
  "ocr-layout": "/cources/generative-ai/RAG/document-ingestion/ocr_Text_layout_Recognition.html",
  "ocr-text": "/cources/generative-ai/RAG/document-ingestion/ocr_Text_Recognition.html",
  "video-ingestion": "/cources/generative-ai/RAG/document-ingestion/Videoingestion.html",
  "rag-intro": "/cources/generative-ai/RAG/rag_introduction.html",
  "rag-phases": "/cources/generative-ai/RAG/phases_of_rag.html",
  "rag-database": "/cources/generative-ai/RAG/database.html",
  "rag-prompt-eng-1-2": "/cources/generative-ai/RAG/prompt enginerring/1-2.html",
  "rag-prompt-eng-3": "/cources/generative-ai/RAG/prompt enginerring/3.html",
  "rag-prompt-eng-4-5": "/cources/generative-ai/RAG/prompt enginerring/4-5.html",
  "rag-api": "/cources/generative-ai/RAG/mastering_llm_apis.html",
  "mcp": "/cources/generative-ai/mcp/MCP.html",
  "ds-python": "/cources/Data_Science/python.html",
  "statistics-probability": "/cources/Data_Science/stats-prob/module_1_and_2.html",
  "ml-module-1": "/cources/Data_Science/machine-learning/module.1.html",
  "ml-module-2": "/cources/Data_Science/machine-learning/module_2.html",
  "ml-module-3": "/cources/Data_Science/machine-learning/Module_3.html",
  "dl-attention-transformers": "/cources/Data_Science/DL/Attention_transformers_with_examples.html",
  "dl-builder-guide": "/cources/Data_Science/DL/builderGuide_with_examples.html",
  "dl-classification": "/cources/Data_Science/DL/Classification_with_examples.html",
  "dl-cnn": "/cources/Data_Science/DL/CNN.html",
  "dl-computational-performance": "/cources/Data_Science/DL/Computational_Performance.html",
  "dl-gan": "/cources/Data_Science/DL/GAN.html",
  "dl-gaussian-processes": "/cources/Data_Science/DL/GaussianProcesses.html",
  "dl-linear-regression": "/cources/Data_Science/DL/Linear_regresssion_DL.html",
  "dl-nlp": "/cources/Data_Science/DL/NLP.html",
  "dl-optimization-technique": "/cources/Data_Science/DL/Optimization_technique.html",
  "dl-perceptron-ff": "/cources/Data_Science/DL/perceptronFF.html",
  "dl-preliminaries": "/cources/Data_Science/DL/Preliminaries.html",
  "dl-rnn": "/cources/Data_Science/DL/RNN_.html",
  "pytorch-tensors": "/cources/Data_Science/pytorch/module1_tensors.html",
  "pytorch-autograd": "/cources/Data_Science/pytorch/module2_autograd.html",
  "pytorch-neural-network": "/cources/Data_Science/pytorch/module3_nn_module.html",
  "pytorch-training-loop": "/cources/Data_Science/pytorch/module4_training_loop.html",
  "pytorch-data-pipeline": "/cources/Data_Science/pytorch/module5_data_pipelines.html",
  "pytorch-evaluation": "/cources/Data_Science/pytorch/module6_evaluation.html",
  "pytorch-cnn": "/cources/Data_Science/pytorch/module7_cnns.html",
  "pytorch-sequence-models": "/cources/Data_Science/pytorch/module8_sequence_models.html",
  "pytorch-training-tricks": "/cources/Data_Science/pytorch/module9_training_tricks.html",
  "pytorch-debugging": "/cources/Data_Science/pytorch/module10_debugging.html",
  "pytorch-distributed": "/cources/Data_Science/pytorch/module11_distributed.html",
  "pytorch-deployment": "/cources/Data_Science/pytorch/module12_deployment.html",
  "clustering-part0": "/cources/clus/part 0.html",
  "clustering-part1": "/cources/clus/part1.html",
  "clustering-part2": "/cources/clus/part 2.html",
  "clustering-part3": "/cources/clus/part 3.html",
  "clustering-part4": "/cources/clus/part 4.html",
  "clustering-part5": "/cources/clus/part 5.html",
  "clustering-part6": "/cources/clus/part 6.html",
  "clustering-part7": "/cources/clus/part 7.html",
  "clustering-part8": "/cources/clus/part 8.html",
  "clustering-part9": "/cources/clus/part 9.html",
  "clustering-part10": "/cources/clus/part 10.html",
  "clustering-part11": "/cources/clus/part 11.html",
  "mrag-intro": "/cources/generative-ai/Multi-modal-rag/Introduction.html",
  "mrag-vlm": "/cources/generative-ai/Multi-modal-rag/VLMs.html",
  "mrag-embedding": "/cources/generative-ai/Multi-modal-rag/Embedding-Spaces.html",
  "mrag-pretraining": "/cources/generative-ai/Multi-modal-rag/Pretraining-Signals.html",
  "mrag-core": "/cources/generative-ai/Multi-modal-rag/MRAG.html",
  "mrag-agents-intro": "/cources/generative-ai/Multi-modal-rag/AGENTS.html",
  "mrag-single-agent": "/cources/generative-ai/Multi-modal-rag/Single-Agent-Paradigms.html",
  "mrag-multi-agent": "/cources/generative-ai/Multi-modal-rag/Multi-Agent-Systems.html",
  "mrag-agentic-rag": "/cources/generative-ai/Multi-modal-rag/Agentic-RAG.html",
  "mrag-evaluation": "/cources/generative-ai/Multi-modal-rag/Evaluation-Debugging.html",
  "mrag-fine-tuning": "/cources/generative-ai/Multi-modal-rag/Efficient-Fine-Tuning.html",
  "mrag-memory": "/cources/generative-ai/Multi-modal-rag/Memory-Safety.html",
};

/**
 * Per-course sidebar metadata for HTML-backed courses.
 * Add an entry here whenever you add a new .docx-based course.
 */
const COURSE_CONFIGS = {
  "prompt-engineering-0": {
    category: "Prompt Engineering",
    title: "Prompt Engineering Mastery",
    icon: "Lightbulb",
    lessons: [
      {
        id: 1,
        title: "Introduction to Prompt Engineering",
        duration: "15m",
        type: "Theory",
        completed: false,
        subTopics: [
          { id: "1.1", title: "What is Prompt Engineering?", completed: false },
          { id: "1.2", title: "Why it Matters", completed: false },
        ],
      },
      {
        id: 2,
        title: "Prompt Structure & Anatomy",
        duration: "20m",
        type: "Theory",
        completed: false,
        subTopics: [
          { id: "2.1", title: "Instructions & Context", completed: false },
          { id: "2.2", title: "Input & Output Format", completed: false },
        ],
      },
      {
        id: 3,
        title: "Core Prompting Techniques",
        duration: "25m",
        type: "Theory",
        completed: false,
        subTopics: [
          { id: "3.1", title: "Zero-Shot & Few-Shot", completed: false },
          { id: "3.2", title: "Chain-of-Thought", completed: false },
          { id: "3.3", title: "Role Prompting", completed: false },
        ],
      },
      {
        id: 4,
        title: "Advanced Techniques",
        duration: "30m",
        type: "Practice",
        completed: false,
        subTopics: [
          { id: "4.1", title: "Tree of Thoughts", completed: false },
          { id: "4.2", title: "ReAct Prompting", completed: false },
          { id: "4.3", title: "RAG & Retrieval Prompts", completed: false },
        ],
      },
      {
        id: 5,
        title: "Prompt Evaluation & Iteration",
        duration: "20m",
        type: "Practice",
        completed: false,
        subTopics: [
          { id: "5.1", title: "Testing Your Prompts", completed: false },
          { id: "5.2", title: "Prompt Debugging", completed: false },
        ],
      },
      {
        id: 6,
        title: "Real-World Applications",
        duration: "35m",
        type: "Project",
        completed: false,
        subTopics: [
          { id: "6.1", title: "Content Generation", completed: false },
          { id: "6.2", title: "Data Extraction", completed: false },
          { id: "6.3", title: "Code Generation", completed: false },
        ],
      },
    ],
  },
  "video-processing-0": {
    category: "Video Processing",
    title: "Video Ingestion Pipeline",
    icon: "Play",
    lessons: [
      {
        id: 1,
        title: "Video Ingestion Complete Guide",
        duration: "10h",
        type: "Theory",
        completed: false,
        subTopics: [],
      },
    ],
  },
  "mcp": {
    category: "Generative AI",
    title: "Model Context Protocol (MCP)",
    icon: "Cpu",
    lessons: [],
  },
  "mrag-intro": {
    category: "Multimodal RAG",
    title: "Introduction to Multimodal AI",
    icon: "BookOpen",
    lessons: [],
  },
  "mrag-vlm": {
    category: "Multimodal RAG",
    title: "Visual Language Models (VLMs)",
    icon: "Image",
    lessons: [],
  },
  "mrag-embedding": {
    category: "Multimodal RAG",
    title: "Visual Embedding Spaces",
    icon: "Layers",
    lessons: [],
  },
  "mrag-pretraining": {
    category: "Multimodal RAG",
    title: "Visual Pre-training Signals",
    icon: "Search",
    lessons: [],
  },
  "mrag-core": {
    category: "Multimodal RAG",
    title: "Multimodality & MRAG Core",
    icon: "Database",
    lessons: [],
  },
  "mrag-agents-intro": {
    category: "Multimodal RAG",
    title: "What is an AI Agent?",
    icon: "Cpu",
    lessons: [],
  },
  "mrag-single-agent": {
    category: "Multimodal RAG",
    title: "Single Agent Paradigms",
    icon: "Zap",
    lessons: [],
  },
  "mrag-multi-agent": {
    category: "Multimodal RAG",
    title: "Multi-Agent Systems",
    icon: "GitBranch",
    lessons: [],
  },
  "mrag-agentic-rag": {
    category: "Multimodal RAG",
    title: "Agentic RAG",
    icon: "Sparkles",
    lessons: [],
  },
  "mrag-evaluation": {
    category: "Multimodal RAG",
    title: "Evaluation & Debugging",
    icon: "FlaskConical",
    lessons: [],
  },
  "mrag-fine-tuning": {
    category: "Multimodal RAG",
    title: "Efficient Fine-Tuning",
    icon: "Cpu",
    lessons: [],
  },
  "mrag-memory": {
    category: "Multimodal RAG",
    title: "Memory & Safety",
    icon: "Lock",
    lessons: [],
  },
  "rag-database": {
    category: "RAG",
    title: "Vector Database",
    icon: "Database",
    lessons: [],
  },
  "rag-api": {
    category: "RAG",
    title: "API and LLM Mastering",
    icon: "Code2",
    lessons: [],
  },
  "rag-phases": {
    category: "RAG",
    title: "Phases of RAG",
    icon: "Layers",
    lessons: [],
  },
  "rag-intro": {
    category: "RAG",
    title: "Introduction to RAG",
    icon: "BookOpen",
    lessons: [],
  },
  "rag-prompt-eng-1-2": {
    category: "Prompt Engineering",
    title: "Prompt Engineering: Part 1 & 2",
    icon: "BookOpen",
    lessons: [],
  },
  "rag-prompt-eng-3": {
    category: "Prompt Engineering",
    title: "Prompt Engineering: Part 3",
    icon: "Zap",
    lessons: [],
  },
  "rag-prompt-eng-4-5": {
    category: "Prompt Engineering",
    title: "Prompt Engineering: Part 4 & 5",
    icon: "Search",
    lessons: [],
  },
  "docformer": {
    category: "Ingestion",
    title: "Docformer",
    icon: "FileText",
    lessons: [],
  },
  "doc-to-image": {
    category: "Ingestion",
    title: "Document to Image",
    icon: "Image",
    lessons: [],
  },
  "infonce": {
    category: "Ingestion",
    title: "InfoNCE",
    icon: "FlaskConical",
    lessons: [],
  },
  "max-seq": {
    category: "Ingestion",
    title: "Maximal Sequential Phrases",
    icon: "Hash",
    lessons: [],
  },
  "ocr-layout": {
    category: "Ingestion",
    title: "OCR Layout Recognition",
    icon: "ScanText",
    lessons: [],
  },
  "ocr-text": {
    category: "Ingestion",
    title: "OCR Text Recognition",
    icon: "ScanText",
    lessons: [],
  },
  "video-ingestion": {
    category: "Ingestion",
    title: "Video Ingestion",
    icon: "Video",
    lessons: [],
  },
  "ml-module-1": {
    category: "Machine Learning",
    title: "Machine Learning - Module 1",
    icon: "BookOpen",
    lessons: [],
  },
  "ml-module-2": {
    category: "Machine Learning",
    title: "Machine Learning - Module 2",
    icon: "Search",
    lessons: [],
  },
  "ml-module-3": {
    category: "Machine Learning",
    title: "Machine Learning - Module 3",
    icon: "Network",
    lessons: [],
  },
};

/**
 * HIGH-ACCURACY HTML parser for Google Docs / DOCX-converted HTML.
 *
 * Handles:
 *  - Real heading tags: h1, h2, h3, h4
 *  - Google Docs class-based pseudo-headings (e.g. class="heading-1", "c-title")
 *  - Nested styled spans inside headings (extracts clean innerText)
 *  - Stable slugified IDs (no duplicate IDs, no off-by-one errors)
 *  - Promotes h1 → main topic if no h2 exists in the document
 *  - Accurate chapter card index (1-based, matches visible numbering)
 */
function processHtml(rawHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // ── Step 1: Normalize Google Docs class-based headings into real <h2>/<h3> ──
  // Google Docs exports sometimes use <p class="heading-1"> or <p class="c1 title">
  const GCLASS_MAP = {
    "heading-1": "h2", // treat Heading 1 from Docs as H2 (main topic)
    "heading-2": "h3", // treat Heading 2 from Docs as H3 (sub-topic)
    "heading-3": "h4",
    "c-title": "h2",
  };

  doc.querySelectorAll("p, div").forEach((el) => {
    const cls = el.className?.toLowerCase() ?? "";
    for (const [gClass, tag] of Object.entries(GCLASS_MAP)) {
      if (cls.includes(gClass)) {
        const newEl = doc.createElement(tag);
        newEl.innerHTML = el.innerHTML;
        el.replaceWith(newEl);
        break;
      }
    }
  });

  // ── Step 1.5: Fallback for poorly formatted docs (no headings, just bold paragraphs) ──
  if (!doc.querySelector("h1, h2, h3, h4")) {
    doc.querySelectorAll("p").forEach((el) => {
      const strong = el.querySelector("strong, b");
      if (strong) {
        const pText = el.textContent.trim();
        const sText = strong.textContent.trim();
        // If the paragraph text exactly matches the bold text, it's acting as a heading!
        if (pText === sText && pText.length > 2) {
          const newEl = doc.createElement("h2");
          newEl.innerHTML = el.innerHTML;
          el.replaceWith(newEl);
        }
      }
    });
  }

  // ── Step 2: Determine which heading tags are "main topic" vs "sub topic" ──
  // Strategy: if doc has h2s → use h2=topic, h3/h4=sub. If only h1s → use h1=topic, h2=sub.
  const hasH2 = doc.querySelector("h2") !== null;
  const [TOPIC_TAG, SUB_TAG] = hasH2 ? ["h2", "h3,h4"] : ["h1", "h2,h3"];

  // ── Step 3: Build a flat ordered list of all relevant headings ──
  const allHeadings = doc.querySelectorAll(`${TOPIC_TAG}, ${SUB_TAG}`);

  const extractedLessons = [];
  const rawToc = [];
  const usedSlugs = new Map(); // slug → count, for deduplication

  let currentLesson = null;
  let lessonCounter = 0; // 1-based after first topic found
  let subTopicCounter = 0;

  /** Slugify + deduplicate an ID */
  const makeId = (prefix, rawText) => {
    const base = `${prefix}-${rawText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")     // remove non-word chars
      .trim()
      .replace(/[\s_]+/g, "-")      // spaces → hyphens
      .replace(/-+/g, "-")          // collapse multiple hyphens
      .slice(0, 60)}`;              // cap length

    const count = usedSlugs.get(base) ?? 0;
    usedSlugs.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };

  /** Extract human-readable text from a heading, stripping invisible chars */
  const getTitle = (el) =>
    (el.innerText ?? el.textContent ?? "")
      .replace(/\u00A0/g, " ")  // non-breaking space → normal space
      .replace(/\s+/g, " ")     // collapse whitespace
      .trim();

  allHeadings.forEach((h) => {
    const tag = h.tagName.toLowerCase();
    const title = getTitle(h);
    if (!title) return; // skip empty headings

    const isTopicTag = tag === TOPIC_TAG;

    if (isTopicTag) {
      lessonCounter++;
      subTopicCounter = 0;

      const id = h.id && !usedSlugs.has(h.id)
        ? h.id                              // keep existing well-formed id
        : makeId("section", title);

      h.id = id;
      usedSlugs.set(id, 1);

      currentLesson = {
        id,
        title,
        duration: "Read",
        type: "Theory",
        completed: false,
        subTopics: [],
      };
      extractedLessons.push(currentLesson);

      rawToc.push({ id, title, level: "h2", index: lessonCounter });

    } else {
      // Sub-topic heading (h3 / h4 / h2 in h1-mode)

      // If an orphan sub-topic appears before the first main topic, create an implicit one
      if (!currentLesson) {
        lessonCounter++;
        const implicitId = makeId("section", "Introduction");
        currentLesson = {
          id: implicitId,
          title: "Introduction",
          duration: "Read",
          type: "Theory",
          completed: false,
          subTopics: [],
        };
        extractedLessons.push(currentLesson);
        rawToc.push({ id: implicitId, title: "Introduction", level: "h2", index: lessonCounter });
      }

      subTopicCounter++;
      const id = h.id && !usedSlugs.has(h.id)
        ? h.id
        : makeId(`sub-${lessonCounter}`, title);

      h.id = id;
      usedSlugs.set(id, 1);

      currentLesson.subTopics.push({ id, title, completed: false });
      rawToc.push({ id, title, level: "h3" });
    }
  });

  // ── Step 4: Compute estimated read time (avg 200 wpm) ──
  const words = (doc.body.textContent || "").trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  return { html: doc.body.innerHTML, toc: extractedLessons, rawToc, readTime };
}

// These are hardcoded lessons for all courses other than the ones under Prompt Engineering and Video Processing.
const LESSONS = [
  {
    id: 1,
    title: "What is an AI Agent?",
    duration: "10m",
    type: "Theory",
    completed: true,
    subTopics: [
      { id: "1.1", title: "The Problem Statement", completed: true },
      { id: "1.2", title: "LLM vs Agent Comparison", completed: true },
      { id: "1.3", title: "Real-world Examples", completed: false },
    ],
  },
  {
    id: 2,
    title: "LLM vs AI Agents",
    duration: "15m",
    type: "Theory",
    completed: false,
    subTopics: [
      { id: "2.1", title: "Architecture Differences", completed: false },
      { id: "2.2", title: "When to Use Each", completed: false },
    ],
  },
  {
    id: 3,
    title: "Core Components: Perception",
    duration: "20m",
    type: "Theory",
    completed: false,
    subTopics: [
      { id: "3.1", title: "Input Modalities", completed: false },
      { id: "3.2", title: "Parsing User Intent", completed: false },
      { id: "3.3", title: "Environment Sensing", completed: false },
    ],
  },
  {
    id: 4,
    title: "Core Components: Reasoning",
    duration: "25m",
    type: "Practice",
    completed: false,
    subTopics: [
      { id: "4.1", title: "Chain-of-Thought", completed: false },
      { id: "4.2", title: "ReAct Framework", completed: false },
    ],
  },
  {
    id: 5,
    title: "Action & Tool Use",
    duration: "30m",
    type: "Practice",
    completed: false,
    subTopics: [
      { id: "5.1", title: "Function Calling", completed: false },
      { id: "5.2", title: "API Tool Integration", completed: false },
      { id: "5.3", title: "Browser & Code Tools", completed: false },
    ],
  },
  {
    id: 6,
    title: "Memory & Context",
    duration: "15m",
    type: "Theory",
    completed: false,
    subTopics: [
      { id: "6.1", title: "Short-Term Memory", completed: false },
      { id: "6.2", title: "Long-Term Memory Stores", completed: false },
    ],
  },
  {
    id: 7,
    title: "Building your first Agent",
    duration: "45m",
    type: "Project",
    completed: false,
    subTopics: [
      { id: "7.1", title: "Project Setup", completed: false },
      { id: "7.2", title: "Implementing the Loop", completed: false },
      { id: "7.3", title: "Testing & Evaluation", completed: false },
      { id: "7.4", title: "Deployment", completed: false },
    ],
  },
];

export default function CourseContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPathIds = location.state?.fromPathIds || [];

  /* ── Resolve course-specific config (for HTML-backed courses) ── */
  const courseConfig = COURSE_CONFIGS[id] ?? null;
  const activeLessons = courseConfig ? courseConfig.lessons : LESSONS;

  const [lessons, setLessons] = useState(activeLessons);
  const [currentLesson, setLesson] = useState(activeLessons[0]?.id ?? 1);
  const [activeSubTopic, setSubTopic] = useState(null);
  const [expandedLesson, setExpanded] = useState(activeLessons[0]?.id ?? 1);
  const [sidebarOpen, setSidebar] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  /* ── Reader enhancements ── */
  const [tocItems, setTocItems] = useState([]); // nested toc items for sidebar
  const [rawTocItems, setRawTocItems] = useState([]); // raw h2 items for chapter card
  const [readTime, setReadTime] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chapterCard, setChapterCard] = useState({ visible: false, title: "", index: 0 });
  const [toast, setToast] = useState({ visible: false, icon: "", msg: "" });
  const scrollContainerRef = useRef(null);
  const proseContentRef = useRef(null);
  const progressBarRef = useRef(null);
  const rafIdRef = useRef(null);
  const milestoneShownRef = useRef(new Set());
  const chapterTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  /* Re-initialise lessons + reader state when route changes */
  useEffect(() => {
    const cfg = COURSE_CONFIGS[id] ?? null;
    const ls = cfg ? cfg.lessons : LESSONS;
    setLessons(ls);
    setLesson(ls[0]?.id ?? 1);
    setExpanded(ls[0]?.id ?? 1);
    setSubTopic(null);
    const isHtmlCourse = !!(COURSE_HTML_MAP[id]);
    setSidebarCollapsed(isHtmlCourse);
    if (progressBarRef.current) progressBarRef.current.style.width = "0%";
    setTocItems([]);
    setRawTocItems([]);
    setReadTime(0);
    milestoneShownRef.current.clear();
    setChapterCard({ visible: false, title: "", index: 0 });
    setToast({ visible: false, icon: "", msg: "" });
  }, [id]);

  /* ── HTML-doc course support ── */
  const htmlFile = COURSE_HTML_MAP[id] ?? null;
  const [docHtml, setDocHtml] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  /* ── Interactive Highlights & Notes ── */
  const [notesState, setNotesState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`marevlo_notes_${id}`) || "[]"); }
    catch { return []; }
  });
  const [selectionMenu, setSelectionMenu] = useState(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  // Save notes to localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`marevlo_notes_${id}`, JSON.stringify(notesState));
    }
  }, [notesState, id]);

  // Selection listener
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !proseContentRef.current) {
        setSelectionMenu(null);
        return;
      }
      if (!proseContentRef.current.contains(selection.anchorNode)) return;

      const text = selection.toString().trim();
      if (text.length < 3) {
        setSelectionMenu(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectionMenu({
        text,
        rect: { top: rect.top, left: rect.left, width: rect.width }
      });
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  // Apply highlights when docHtml or notes change
  useEffect(() => {
    if (!proseContentRef.current || !docHtml) return;
    
    const container = proseContentRef.current;
    
    // 1. Un-wrap old highlights
    const oldMarks = container.querySelectorAll("mark.custom-highlight");
    oldMarks.forEach(m => {
       const parent = m.parentNode;
       while (m.firstChild) parent.insertBefore(m.firstChild, m);
       parent.removeChild(m);
    });

    if (notesState.length === 0) return;

    // 2. Apply new highlights using TreeWalker
    notesState.forEach(note => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let node;
        let matchFound = false;
        
        while ((node = walker.nextNode()) && !matchFound) {
            const idx = node.nodeValue.indexOf(note.text);
            if (idx !== -1) {
               const matchNode = node.splitText(idx);
               matchNode.splitText(note.text.length);
               
               const mark = document.createElement("mark");
               mark.className = `custom-highlight ${note.color} rounded px-0.5 cursor-pointer relative group transition-colors`;
               if (note.note) mark.title = note.note;
               mark.onclick = () => setNotesPanelOpen(true);
               
               matchNode.parentNode.insertBefore(mark, matchNode);
               mark.appendChild(matchNode);
               matchFound = true;
            }
        }
    });
  }, [docHtml, notesState]);

  const handleAddHighlight = (colorClass) => {
    if (!selectionMenu) return;
    
    // Find current lesson title for context
    const currentLessonData = activeLessons.find(l => l.id === currentLesson);
    const lessonTitle = currentLessonData?.title || "Course Content";

    const newNote = {
      id: "note_" + Date.now(),
      text: selectionMenu.text,
      color: colorClass,
      note: "",
      createdAt: new Date().toISOString(),
      lessonId: currentLesson,
      lessonTitle: lessonTitle,
    };
    setNotesState(prev => [newNote, ...prev]); // Newest first
    window.getSelection()?.removeAllRanges();
    setSelectionMenu(null);
  };

  useEffect(() => {
    if (!htmlFile) { setDocHtml(""); setTocItems([]); setRawTocItems([]); setReadTime(0); setQuizData(null); return; }
    setDocLoading(true);

    const quizUrl = htmlFile.replace(/\.html$/, '_quiz.json');
    fetch(quizUrl)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.questions && data.questions.length > 0) {
          setQuizData(data);
        } else {
          setQuizData(null);
        }
      })
      .catch(() => setQuizData(null));

    fetch(htmlFile)
      .then((r) => r.text())
      .then((raw) => {
        const { html, toc, rawToc, readTime: rt } = processHtml(raw);
        setDocHtml(html);
        setTocItems(toc);     // Extracted dynamic lessons array
        setRawTocItems(rawToc); // Raw list of headings
        setReadTime(rt);
        setLessons(toc); // Override lessons with the TOC dynamically extracted

        // Auto-select first lesson
        if (toc.length > 0) {
          setLesson(toc[0].id);
          setExpanded(toc[0].id);
        }

        setDocLoading(false);
      })
      .catch(() => { setDocHtml("<p>Failed to load content.</p>"); setDocLoading(false); });
  }, [htmlFile]);

  /* Auto-dismiss chapter card on Escape + Keyboard Navigation */
  useEffect(() => {
    const onKey = (e) => { 
      // Escape - exit focus mode / dismiss overlays
      if (e.key === "Escape") { 
        setFocusMode(false); 
        setChapterCard(c => ({ ...c, visible: false })); 
        setNotesPanelOpen(false);
      }
      // Arrow keys for navigation (when not in input)
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          goNext();
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goPrev();
        }
        // F key for focus mode
        if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
          setFocusMode(prev => !prev);
        }
        // N key for notes panel
        if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
          setNotesPanelOpen(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, flatNodes.length]);
  
  /* Confetti celebration on 100% completion */
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (progress >= 100 && !showConfetti) {
      setShowConfetti(true);
      // Auto-hide confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [progress, showConfetti]);

  /* Reading progress (direct DOM) + milestone celebrations (rAF throttled) */
  const handleScroll = useCallback((e) => {
    if (rafIdRef.current) return;
    const el = e.currentTarget;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
      if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;

      // Milestone toasts
      const MILESTONES = [
        { pct: 25, icon: "🎯", msg: "25% done — great start!" },
        { pct: 50, icon: "🔥", msg: "Halfway there — you're on fire!" },
        { pct: 75, icon: "⚡", msg: "75% — almost finished!" },
        { pct: 100, icon: "🏆", msg: "Complete! Excellent work!" },
      ];
      MILESTONES.forEach(({ pct: target, icon, msg }) => {
        if (pct >= target && !milestoneShownRef.current.has(target)) {
          milestoneShownRef.current.add(target);
          setToast({ visible: true, icon, msg });
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(
            () => setToast(t => ({ ...t, visible: false })), 3500
          );
        }
      });
    });
  }, []);

  /* Mark HTML course sections as completed while scrolling */
  useEffect(() => {
    if (!htmlFile) return;

    // Prevent reverse progress loops: only update if going forward
    setLessons((prev) => {
      let shouldUpdate = false;
      const nextState = prev.map((l, lIdx) => {
        const currIdx = prev.findIndex(x => x.id === currentLesson);
        const isCompleted = lIdx <= currIdx;

        let lChanged = l.completed !== isCompleted;

        const newSubTopics = l.subTopics.map((sub, sIdx) => {
          let subCompleted = false;
          if (lIdx < currIdx) subCompleted = true;
          else if (lIdx === currIdx) {
            const activeSubIdx = l.subTopics.findIndex(x => x.id === activeSubTopic);
            if (activeSubIdx !== -1 && sIdx <= activeSubIdx) subCompleted = true;
          }
          // Do not un-complete lessons if scrolling up
          if (sub.completed) subCompleted = true;

          if (sub.completed !== subCompleted) shouldUpdate = true;
          return sub.completed !== subCompleted ? { ...sub, completed: subCompleted } : sub;
        });

        if (lChanged) shouldUpdate = true;

        return (lChanged || shouldUpdate)
          ? { ...l, completed: isCompleted || l.completed, subTopics: newSubTopics }
          : l;
      });
      return shouldUpdate ? nextState : prev;
    });
  }, [currentLesson, activeSubTopic, htmlFile]);

  /* Active section tracking and Cinematic chapter card */
  useEffect(() => {
    if (!docHtml || !proseContentRef.current) return;
    const seenIds = new Set();
    let scrollTimeout = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {

            // Chapter card logic (only for H2s) - FIRES IMMEDIATELY
            if (!seenIds.has(entry.target.id) && entry.target.tagName.toLowerCase() === "h2") {
              seenIds.add(entry.target.id);
              const node = rawTocItems.find(t => t.id === entry.target.id);
              if (node) {
                const title = entry.target.textContent.trim().slice(0, 90);
                setChapterCard({ visible: true, title, index: node.index });
                clearTimeout(chapterTimerRef.current);
                chapterTimerRef.current = setTimeout(
                  () => setChapterCard(c => ({ ...c, visible: false })), 2200
                );
              }
            }

            // Sync sidebar active states based on visible header (DEBOUNCED)
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              const targetId = entry.target.id;

              const matchedLesson = tocItems.find(l => l.id === targetId);
              if (matchedLesson) {
                setLesson(matchedLesson.id);
                setExpanded(matchedLesson.id);
                setSubTopic(null);
              } else {
                tocItems.forEach(l => {
                  const matchedSub = l.subTopics.find(sub => sub.id === targetId);
                  if (matchedSub) {
                    setLesson(l.id);
                    setExpanded(l.id); // Also expand its parent
                    // React batches these internally so it only causes one re-render queue
                    setSubTopic(matchedSub.id);
                  }
                });
              }
            }, 60); // 60ms debounce for buttery scrolling
          }
        });
      },
      { rootMargin: "-10% 0px -85% 0px", threshold: 0 }
    );
    const headings = proseContentRef.current.querySelectorAll("h2, h3");
    headings.forEach(h => observer.observe(h));
    return () => {
      observer.disconnect();
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [docHtml, tocItems, rawTocItems]);

  /* ── Flat Structure mapping for unified progress & pagination ── */
  const flatNodes = useMemo(() => {
    const list = [];
    lessons.forEach(l => {
      // Push main topic
      list.push({ isSub: false, parentId: null, ...l });
      // Push all sub topics linearly
      if (l.subTopics && l.subTopics.length > 0) {
        l.subTopics.forEach(s => {
          list.push({ isSub: true, parentId: l.id, ...s });
        });
      }
    });
    return list;
  }, [lessons]);

  const activeNodeId = activeSubTopic || currentLesson;
  const currentIndex = flatNodes.findIndex(n => n.id === activeNodeId);

  // Progress computation directly mapped to flat linear progression
  const completedCount = flatNodes.filter(n => n.completed).length;
  // if no subtopics, length is same. In deep documents it combines h2+h3 count
  const progress = flatNodes.length ? (completedCount / flatNodes.length) * 100 : 0;

  const lesson = lessons.find((l) => l.id === currentLesson);

  const goNext = () => {
    const next = flatNodes[currentIndex + 1];
    if (next) {
      if (next.isSub) {
        setLesson(next.parentId);
        setExpanded(next.parentId);
        setSubTopic(next.id);
      } else {
        setLesson(next.id);
        setExpanded(next.id);
        setSubTopic(null);
      }

      // Click-to-scroll to the heading if HTML course
      if (htmlFile) {
        document.getElementById(next.id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const goPrev = () => {
    const prev = flatNodes[currentIndex - 1];
    if (prev) {
      if (prev.isSub) {
        setLesson(prev.parentId);
        setExpanded(prev.parentId);
        setSubTopic(prev.id);
      } else {
        setLesson(prev.id);
        setExpanded(prev.id);
        setSubTopic(null);
      }

      if (htmlFile) {
        document.getElementById(prev.id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  /* When a lesson row is clicked: select it + toggle its accordion */
  const handleLessonClick = (l) => {
    setLesson(l.id);
    setSubTopic(null);
    setExpanded((prev) => (prev === l.id ? null : l.id)); // toggle
    setSidebar(false);

    if (htmlFile) {
      document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubTopicClick = (sub, e) => {
    e.stopPropagation();
    setSubTopic(sub.id);

    if (htmlFile) {
      document.getElementById(sub.id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* Shared inline-style helpers */
  const S = {
    bg: { background: "var(--color-app-bg)", color: "var(--color-primary-text)" },
    surface: { background: "var(--color-surface)", borderColor: "var(--color-border)" },
    border: { borderColor: "var(--color-border)" },
    muted: { color: "var(--color-muted-text)" },
    primary: { color: "var(--color-primary-text)" },
    inverted: { background: "var(--color-primary-text)", color: "var(--color-app-bg)" },
  };
  const hoverSurface = (e) => (e.currentTarget.style.background = "var(--color-surface-hover)");
  const hoverClear = (e) => (e.currentTarget.style.background = "transparent");

  return (
    <div className="flex h-screen overflow-hidden" style={S.bg}>

      {/* ── Confetti Celebration (Phase 2) ── */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                background: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Floating "Exit Focus" pill ── */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-xl transition-all hover:scale-105 active:scale-95"
          style={S.inverted}
          title="Exit Focus Mode (Esc)"
        >
          <Minimize2 size={13} /> Exit Focus
        </button>
      )}
      
      {/* ── Floating Mini TOC (Focus Mode) ── */}
      {focusMode && htmlFile && lessons.length > 0 && (
        <div className="floating-toc-mini">
          {lessons.slice(0, 12).map((l) => (
            <button
              key={l.id}
              className={`floating-toc-mini-dot ${l.id === currentLesson ? 'active' : ''}`}
              onClick={() => {
                setLesson(l.id);
                document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              title={l.title}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════
            SIDEBAR
          ════════════════════════════════ */}
      {!focusMode && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r",
          "transition-all duration-300 ease-in-out",
          "lg:static lg:z-auto lg:flex-shrink-0",
          focusMode || sidebarCollapsed
            ? "w-72 -translate-x-full lg:w-0 lg:min-w-0 lg:overflow-hidden lg:border-0"
            : "w-72 " + (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"),
        ].join(" ")}
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Sidebar header */}
        <div className="px-5 pt-6 pb-5 border-b flex-shrink-0" style={S.border}>
          <button
            onClick={() => navigate("/courses", { state: { pathIds: fromPathIds } })}
            className="flex items-center gap-2 text-sm font-medium mb-5 group transition-colors"
            style={S.muted}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted-text)")}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Courses
          </button>

          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={S.inverted}
            >
              <Brain size={18} />
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={S.muted}>
                {courseConfig ? courseConfig.category : "Generative AI"}
              </p>
              <h2 className="text-sm font-bold leading-snug">
                {courseConfig ? courseConfig.title : "AI Mastery Course"}
              </h2>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={S.muted}>{completedCount}/{flatNodes.length} sections</span>
              <span className="text-xs font-bold" style={{ color: "var(--color-primary-text)" }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]"
                style={{
                  width: `${progress}%`,
                  boxShadow: progress > 0 ? "0 0 10px rgba(99,102,241,0.5)" : "none"
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Premium Glassmorphic Lesson Cards ── */}
        <div className="flex-1 overflow-y-auto py-5 px-4 custom-scrollbar space-y-3">
          {lessons.map((l, index) => {
            const isActive = l.id === currentLesson;
            const isExpanded = l.id === expandedLesson;
            const hasSubTopics = l.subTopics && l.subTopics.length > 0;

            // Calculate progress for the SVG ring
            let progressPct = 0;
            if (hasSubTopics) {
              const completedSubs = l.subTopics.filter(s => s.completed).length;
              progressPct = (completedSubs / l.subTopics.length) * 100;
            } else if (l.completed) {
              progressPct = 100;
            }

            // Circumference for the progress ring (r=16, C = 2*PI*r)
            const circumference = 2 * Math.PI * 16;
            const strokeOffset = circumference - (circumference * progressPct) / 100;

            return (
              <div
                key={l.id}
                className={`lesson-card-premium ${isActive ? 'active' : ''}`}
                style={{
                  opacity: l.completed || isActive ? 1 : 0.7,
                }}
                onMouseEnter={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.25)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.transform = "";
                  }
                }}
              >
                {/* ── Main Module Header ── */}
                <button
                  onClick={() => handleLessonClick(l)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors relative z-10 w-full hover:bg-transparent"
                >
                  <div className="w-5 text-[10px] font-black tracking-widest opacity-30 mt-0.5 text-right flex-shrink-0" style={S.primary}>
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  {/* Enhanced Animated Progress Ring */}
                  <div className="progress-ring-container">
                    {progressPct === 100 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    ) : (
                      <>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                          <circle 
                            cx="20" cy="20" r="16" 
                            className="progress-ring-bg"
                            strokeWidth="3" 
                          />
                          <circle
                            cx="20" cy="20" r="16"
                            className={`progress-ring-fill ${isActive ? 'text-indigo-500' : 'text-neutral-400'}`}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeOffset}
                            style={{ 
                              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                              filter: isActive ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))' : 'none'
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isActive ? (
                            <div 
                              className="w-3 h-3 rounded-full animate-pulse" 
                              style={{ 
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 0 12px rgba(99, 102, 241, 0.8)'
                              }} 
                            />
                          ) : progressPct > 0 ? (
                            <span className="text-[8px] font-bold" style={{ color: 'var(--color-muted-text)' }}>
                              {Math.round(progressPct)}%
                            </span>
                          ) : (
                            <div className="w-2 h-2 rounded-full opacity-30" style={{ background: 'var(--color-muted-text)' }} />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Title + Meta */}
                  <span className="flex-1 min-w-0 pl-1">
                    <span
                      className="block text-sm font-bold truncate transition-colors duration-200"
                      style={{ color: isActive ? "var(--color-primary-text)" : "var(--color-muted-text)" }}
                    >
                      {l.title}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold tracking-wide uppercase opacity-70" style={S.muted}>
                      <Clock size={10} /> {l.duration} {l.type ? `· ${l.type}` : ""}
                    </span>
                  </span>

                  {/* Chevron Toggle */}
                  {hasSubTopics && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 opacity-60 group-hover:opacity-100"
                      style={{
                        background: isExpanded ? "var(--color-primary-text)" : "transparent",
                        color: isExpanded ? "var(--color-app-bg)" : "var(--color-primary-text)",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                      }}
                    >
                      <ChevronDown size={14} />
                    </div>
                  )}
                </button>

                {/* ── Sub-topics Spring Accordion ── */}
                {hasSubTopics && (
                  <div
                    className="overflow-hidden transition-all duration-500 ease-in-out relative z-0"
                    style={{
                      maxHeight: isExpanded ? `${l.subTopics.length * 60}px` : "0px",
                      opacity: isExpanded ? 1 : 0
                    }}
                  >
                    <div className="pb-3 px-3 space-y-1">
                      {l.subTopics.map((sub) => {
                        const subActive = activeSubTopic === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={(e) => handleSubTopicClick(sub, e)}
                            className="relative w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-xl text-left transition-all duration-200 group overflow-hidden"
                            style={{
                              background: subActive ? "var(--color-surface)" : "transparent",
                              boxShadow: subActive ? "0 2px 10px rgba(0,0,0,0.03)" : "none"
                            }}
                          >
                            {/* Neon active indicator line */}
                            {subActive && (
                              <div className="absolute left-2 top-0 bottom-0 w-[3px] my-2 bg-gradient-to-b from-[#6366f1] to-[#8b5cf6] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            )}

                            {/* Subtopic Status Icon */}
                            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                              {sub.completed
                                ? <CheckCircle2 size={13} style={{ color: "var(--color-primary-text)" }} />
                                : <Dot size={20} className="transition-transform group-hover:scale-150" style={S.muted} />}
                            </div>

                            {/* Subtopic Title */}
                            <span
                              className="text-xs truncate transition-all duration-200"
                              style={{
                                fontWeight: subActive ? 700 : 500,
                                color: subActive ? "var(--color-primary-text)" : "var(--color-muted-text)",
                                transform: subActive ? "translateX(4px)" : "none"
                              }}
                            >
                              {sub.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t flex-shrink-0 space-y-4" style={S.border}>
          {quizData && (
            <div
              className="relative overflow-hidden rounded-2xl p-5 border group cursor-pointer transition-all duration-300"
              style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.3)" }}
              onClick={() => setQuizModalOpen(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none group-hover:bg-indigo-500/40 transition-colors duration-500" />
              <div className="flex items-start gap-3 relative z-10 w-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                  <Brain size={20} color="#fff" />
                </div>
                <div className="flex-1 w-full mt-0.5">
                  <h3 className="font-bold text-sm text-indigo-400 mb-0.5 tracking-tight group-hover:text-indigo-300 transition-colors">Knowledge Check</h3>
                  <p className="text-xs text-indigo-200/60 leading-relaxed mb-3">Test what you've learned.</p>
                  <button className="w-full flex justify-center items-center gap-1.5 text-xs font-bold text-white bg-indigo-500/20 hover:bg-indigo-500/40 px-3 py-2 rounded-lg transition-colors border border-indigo-500/30">
                    Take Quiz <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className="flex items-start gap-3 p-4 rounded-2xl border"
            style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)" }}
          >
            <Award size={17} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold mb-0.5">Earn a Certificate</p>
              <p className="text-xs" style={S.muted}>
                Finish all lessons to unlock your certificate + 500 XP
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════
            MAIN PANEL
          ════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Reading progress bar (HTML courses only) ── */}
        {htmlFile && (
          <div ref={progressBarRef} className="reading-progress-bar" style={{ width: "0%" }} />
        )}

        {/* ── Enhanced Cinematic Chapter Card ── */}
        {htmlFile && chapterCard.visible && (
          <div
            className="chapter-card-premium"
            onClick={() => setChapterCard(c => ({ ...c, visible: false }))}
          >
            <div className="chapter-card-premium-content" onClick={e => e.stopPropagation()}>
              <div className="chapter-card-premium-number">{chapterCard.index}</div>
              <span className="chapter-card-premium-label">Now Reading</span>
              <h2 className="chapter-card-premium-title">{chapterCard.title}</h2>
              <div className="chapter-card-premium-line" />
            </div>
          </div>
        )}

        {/* ── Enhanced Milestone Toast with Progress ── */}
        {htmlFile && toast.visible && (
          <div className="milestone-toast-premium" onClick={() => setToast(t => ({ ...t, visible: false }))}>
            <span className="milestone-toast-premium-icon">{toast.icon}</span>
            <div className="milestone-toast-premium-content">
              <span className="milestone-toast-premium-title">{toast.msg}</span>
              <span className="milestone-toast-premium-subtitle">Keep going!</span>
              <div className="milestone-toast-premium-progress">
                <div className="milestone-toast-premium-progress-bar" />
              </div>
            </div>
          </div>
        )}

        {/* Top bar */}
        {!focusMode && (
          <header
            className="flex-shrink-0 h-14 flex items-center justify-between px-4 sm:px-6 border-b gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Universal Back Button */}
              <button
                onClick={() => navigate("/courses", { state: { pathIds: fromPathIds } })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:-translate-x-0.5"
                style={{ background: "var(--color-primary-text)", color: "var(--color-app-bg)" }}
              >
                <ArrowLeft size={13} /> Back
              </button>

              <button
                className="lg:hidden p-1.5 rounded-lg transition-colors flex-shrink-0"
                onClick={() => setSidebar(true)}
                style={S.muted}
                onMouseEnter={hoverSurface}
                onMouseLeave={hoverClear}
              >
                <Menu size={18} />
              </button>
              {/* Desktop sidebar toggle for HTML courses */}
              {htmlFile && (
                <button
                  className="hidden lg:flex p-1.5 rounded-lg transition-colors flex-shrink-0 bg-opacity-50"
                  onClick={() => setSidebarCollapsed(v => !v)}
                  style={sidebarCollapsed ? { background: "var(--color-surface-hover)" } : S.muted}
                  title={sidebarCollapsed ? "Show course outline" : "Hide course outline"}
                  onMouseEnter={hoverSurface}
                  onMouseLeave={hoverClear}
                >
                  <Menu size={18} />
                </button>
              )}
              <div className="hidden md:flex items-center gap-1.5 text-xs min-w-0 px-2 border-l ml-1" style={{ borderColor: 'var(--color-border)', ...S.muted }}>
                <span className="truncate">Generative AI</span>
                <ChevronRight size={12} className="flex-shrink-0" />
                <span className="font-semibold truncate" style={S.primary}>
                  {lesson?.title || 'Loading...'}
                  {activeSubTopic && (
                    <span style={S.muted}> › {lesson?.subTopics?.find(s => s.id === activeSubTopic)?.title}</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setNotesPanelOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                title="View Notes & Highlights (N)"
              >
                <StickyNote size={13} /> {notesState.length > 0 ? notesState.length : "Notes"}
                <span className="kbd-badge">N</span>
              </button>

              <button
                onClick={() => setFocusMode(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                style={{ borderColor: "var(--color-border)", ...S.muted, background: "transparent" }}
                onMouseEnter={hoverSurface}
                onMouseLeave={hoverClear}
                title="Enter Focus Mode (F)"
                >
                <Maximize2 size={13} /> Focus
                <span className="kbd-badge ml-1">F</span>
                </button>

              <div className="flex items-center gap-0.5 pl-3" style={{ borderLeft: "1px solid var(--color-border)" }}>
                <button
                  disabled={currentIndex === 0}
                  onClick={goPrev}
                  className="p-1.5 rounded-xl transition-colors disabled:opacity-30"
                  style={S.muted}
                  onMouseEnter={hoverSurface}
                  onMouseLeave={hoverClear}
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="text-xs font-mono px-1.5" style={S.muted}>
                  {currentIndex + 1}/{flatNodes.length}
                </span>
                <button
                  disabled={currentIndex === flatNodes.length - 1}
                  onClick={goNext}
                  className="p-1.5 rounded-xl transition-colors disabled:opacity-30"
                  style={S.muted}
                  onMouseEnter={hoverSurface}
                  onMouseLeave={hoverClear}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Scrollable lesson content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" onScroll={htmlFile ? handleScroll : undefined}>
          {htmlFile ? (
            /* ── Immersive full-screen HTML reader ── */
            <div>

              {/* Hero Banner - Premium Visual Enhancement */}
              {!focusMode && courseConfig && (
                <div className="course-hero-premium">
                  {/* Animated Gradient Mesh Orbs */}
                  <div className="hero-mesh-orb hero-mesh-orb-1" />
                  <div className="hero-mesh-orb hero-mesh-orb-2" />
                  <div className="hero-mesh-orb hero-mesh-orb-3" />
                  
                  <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 pt-16 pb-14">
                    {/* Category Badge with Glow */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className="hero-category-badge">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {courseConfig.category}
                      </span>
                      {/* Social Proof */}
                      <div className="social-proof-badge hidden sm:flex">
                        <div className="social-proof-badge-avatar-stack">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="social-proof-badge-avatar" style={{ animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                        <span>2.4k+ enrolled</span>
                      </div>
                    </div>
                    
                    {/* Animated Gradient Title */}
                    <h1 className="hero-title-premium">{courseConfig.title}</h1>
                    
                    {/* Subtitle with better typography */}
                    <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "var(--color-muted-text)" }}>
                      {courseConfig.subtitle || "An expertly crafted document course. Read at your own pace and master every concept."}
                    </p>
                    
                    {/* Premium Stat Pills */}
                    <div className="flex flex-wrap gap-3 mt-8">
                      {[
                        { icon: <BookOpen size={16} />, label: `${lessons.length || courseConfig.lessons.length} Sections`, accent: "#6366f1" },
                        { icon: <Clock size={16} />, label: readTime > 0 ? `${readTime} min read` : "Calculating...", accent: "#06b6d4" },
                        { icon: <Zap size={16} />, label: "Interactive", accent: "#10b981" },
                        { icon: <Award size={16} />, label: "Certificate", accent: "#f59e0b" },
                      ].map((s) => (
                        <span key={s.label} className="hero-stat-pill group">
                          <span style={{ color: s.accent }}>{s.icon}</span>
                          {s.label}
                        </span>
                      ))}
                    </div>
                    
                    {/* Streak & XP indicators */}
                    <div className="flex items-center gap-4 mt-6">
                      <div className="streak-counter">
                        <span className="streak-counter-fire">🔥</span>
                        <span>3 day streak</span>
                      </div>
                      <div className="xp-badge">
                        <span>★</span>
                        <span>+500 XP</span>
                      </div>
                    </div>
                    
                    {/* Premium CTA Button */}
                    <button
                      className="hero-cta-button group"
                      onClick={() => {
                        const scrollEl = scrollContainerRef.current;
                        const banner = scrollEl?.querySelector(".course-hero-premium");
                        const offset = banner ? banner.offsetHeight : 380;
                        scrollEl?.scrollTo({ top: offset, behavior: "smooth" });
                      }}
                    >
                      <PlayCircle size={20} className="transition-transform group-hover:scale-110" />
                      Start Learning
                      <ChevronDown size={18} className="animate-bounce" />
                    </button>
                  </div>
                </div>
              )}

              {/* Two-column: content + sticky TOC */}
              <div className="reader-layout">
                {/* Article */}
                <div className="reader-content-col">
                  {docLoading ? (
                    <div className="flex items-center justify-center py-24" style={S.muted}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        <span className="text-sm font-medium">Loading course content…</span>
                      </div>
                    </div>
                  ) : (
                    <MemoizedProseContent html={docHtml} innerRef={proseContentRef} />
                  )}
                </div>

              </div>
            </div>


          ) : (
            /* ── Default hardcoded lesson content ── */
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 pb-28">

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-7">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                  style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)", ...S.muted }}
                >
                  <BookOpen size={11} /> Foundations
                </span>
                {lesson?.type && (
                  <span
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={
                      lesson.type === "Practice"
                        ? S.inverted
                        : { background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", ...S.muted }
                    }
                  >
                    {lesson.type}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={S.muted}>
                  <Clock size={11} /> {lesson?.duration}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
                Start with the Problem
              </h1>
              <p className="text-[15px] leading-relaxed mb-10" style={S.muted}>
                To understand AI Agents, imagine you give a single instruction:{" "}
                <em className="font-semibold not-italic" style={S.primary}>
                  "Book a flight to Delhi for tomorrow."
                </em>
              </p>

              {/* Comparison cards */}
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div
                  className="p-6 rounded-2xl border"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 border"
                    style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)" }}
                  >
                    <BookOpen size={16} style={S.muted} />
                  </div>
                  <h3 className="font-bold mb-1.5 text-sm">Standard LLM</h3>
                  <p className="text-sm leading-relaxed mb-4" style={S.muted}>
                    "Here's how to book a flight: go to Expedia, choose your date…"
                  </p>
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{ borderColor: "var(--color-border)", ...S.muted }}
                  >
                    Talks, but doesn't act
                  </span>
                </div>

                <div className="p-6 rounded-2xl" style={S.inverted}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(128,128,128,0.25)" }}
                  >
                    <Zap size={16} />
                  </div>
                  <h3 className="font-bold mb-1.5 text-sm">AI Agent</h3>
                  <p className="text-sm leading-relaxed mb-4 opacity-70">
                    Opens browser, searches flights, picks the best option, fills details, confirms booking.
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(128,128,128,0.25)" }}
                  >
                    <Zap size={11} fill="currentColor" /> Thinks, acts & finishes
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-7" style={S.muted}>
                <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest">Core Distinction</span>
                <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
              </div>

              {/* Distinction items */}
              <div className="space-y-3 mb-10">
                {[
                  { tag: "LLM", label: "Knowledge Engine", desc: "Knows things, explains things — but stops there." },
                  { tag: "AGENT", label: "Action Engine", desc: "Knows, plans, and executes tasks autonomously." },
                ].map((item) => (
                  <div
                    key={item.tag}
                    className="flex items-start gap-4 p-5 rounded-2xl border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <code
                      className="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded mt-0.5 border"
                      style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)", ...S.primary }}
                    >
                      {item.tag}
                    </code>
                    <div>
                      <p className="font-bold text-sm mb-0.5">{item.label}</p>
                      <p className="text-sm" style={S.muted}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key components */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <div
                  className="px-6 py-4 border-b"
                  style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)" }}
                >
                  <h3 className="text-sm font-bold">Key Components of an AI Agent</h3>
                </div>
                <div style={{ background: "var(--color-surface)" }}>
                  {[
                    { n: "01", title: "Perception", desc: "Understanding the user's intent and environment signals." },
                    { n: "02", title: "Reasoning", desc: "Planning a multi-step strategy to achieve the goal." },
                    { n: "03", title: "Action", desc: "Executing tasks using tools — APIs, browsers, databases." },
                    { n: "04", title: "Memory", desc: "Maintaining state and context across long interactions." },
                    { n: "05", title: "Learning", desc: "Improving continuously from feedback and outcomes." },
                  ].map((c, i, arr) => (
                    <div
                      key={c.n}
                      className="flex items-start gap-4 px-6 py-4"
                      style={i < arr.length - 1 ? { borderBottom: "1px solid var(--color-border)" } : {}}
                    >
                      <span className="text-xs font-mono font-bold flex-shrink-0 w-6 mt-0.5" style={S.muted}>{c.n}</span>
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="text-sm mt-0.5" style={S.muted}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Bottom navigation */}
        {!focusMode && (
          <div
            className="flex-shrink-0 border-t px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <button
              disabled={currentIndex === 0}
              onClick={goPrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-30"
              style={{ borderColor: "var(--color-border)", ...S.primary, background: "transparent" }}
              onMouseEnter={hoverSurface}
              onMouseLeave={hoverClear}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {/* Pill indicators */}
            <div className="hidden sm:flex items-center gap-1.5">
              {flatNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (n.isSub) {
                      setLesson(n.parentId); setExpanded(n.parentId); setSubTopic(n.id);
                    } else {
                      setLesson(n.id); setExpanded(n.id); setSubTopic(null);
                    }
                    if (htmlFile) document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: n.id === activeNodeId ? "18px" : "7px",
                    height: "7px",
                    background: n.id === activeNodeId
                      ? "var(--color-primary-text)"
                      : n.completed
                        ? "var(--color-muted-text)"
                        : "var(--color-border)",
                  }}
                  aria-label={`Section ${n.id}`}
                />
              ))}
            </div>

            <button
              disabled={currentIndex === flatNodes.length - 1}
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={S.inverted}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Quiz Modal Popup */}
      {quizModalOpen && quizData && (
        <QuizModal quiz={quizData} onClose={() => setQuizModalOpen(false)} />
      )}

      {/* Floating Selection Menu */}
      {selectionMenu && (
        <div 
          className="fixed z-[99999] flex items-center gap-2 p-2 rounded-2xl bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200"
          style={{ 
             top: Math.max(10, selectionMenu.rect.top - 65), 
             left: selectionMenu.rect.left + (selectionMenu.rect.width / 2) - 110 
          }}
        >
          <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 backdrop-blur-md">
             {[
               { color: "bg-yellow-400", shadow: "rgba(250,204,21,0.5)", class: "bg-yellow-500/30 text-yellow-200" },
               { color: "bg-emerald-400", shadow: "rgba(52,211,153,0.5)", class: "bg-emerald-500/30 text-emerald-200" },
               { color: "bg-purple-400", shadow: "rgba(192,132,252,0.5)", class: "bg-purple-500/30 text-purple-200" }
             ].map((c, i) => (
               <button 
                 key={i}
                 onClick={() => handleAddHighlight(c.class)} 
                 className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center group transition-all active:scale-90"
               >
                 <div 
                   className={`w-3.5 h-3.5 rounded-full ${c.color} shadow-[0_0_12px_${c.shadow}] group-hover:scale-125 transition-transform`} 
                 />
               </button>
             ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-0.5" />
          <button 
             onClick={() => { handleAddHighlight("bg-indigo-500/30 text-indigo-200"); setNotesPanelOpen(true); }}
             className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-400 rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95 group"
          >
             <Edit3 size={12} className="group-hover:rotate-12 transition-transform" /> 
             <span>ADD NOTE</span>
          </button>
        </div>
      )}

      {/* Slide-out Notes Panel */}
      {notesPanelOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" 
            onClick={() => setSelectionMenu(null) || setNotesPanelOpen(false)} 
          />
          <div 
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[100vw] z-[100001] backdrop-blur-2xl border-l transition-all duration-500 flex flex-col shadow-[-20px_0_80px_rgba(0,0,0,0.4)] animate-in slide-in-from-right"
            style={{
               backgroundColor: isDark ? 'rgba(13, 17, 23, 0.85)' : 'rgba(255, 255, 255, 0.95)',
               borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Sidebar Header */}
            <div 
              className="px-7 py-6 border-b flex items-center justify-between"
              style={{
                 backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                 borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <StickyNote size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight leading-tight">Your Notebook</h2>
                  <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Course Insights & Highlights</p>
                </div>
              </div>
              <button 
                onClick={() => setNotesPanelOpen(false)} 
                className="w-10 h-10 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-premium">
              {notesState.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    <Brain size={40} className="text-white/10 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                  </div>
                  <h3 className="text-base font-bold text-white/60">No insights saved yet</h3>
                  <p className="text-sm text-white/30 mt-2 leading-relaxed">
                    Highlight interesting parts of the course to save them here and add your thoughts.
                  </p>
                </div>
              ) : (
                notesState.map((note) => (
                  <div 
                    key={note.id} 
                    className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl group"
                    style={{
                       backgroundColor: isDark ? 'rgba(22, 27, 34, 0.6)' : 'rgba(255, 255, 255, 0.5)',
                       borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Highlighted Quote Section */}
                    <div 
                      className="p-5 border-l-4"
                      style={{
                         borderColor: `${note.color.includes('indigo') ? '#6366f1' : note.color.includes('yellow') ? '#fbbf24' : note.color.includes('emerald') ? '#10b981' : '#a855f7'}88`,
                         backgroundColor: isDark ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.02)',
                      }}
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-60" style={{ color: note.color.includes('indigo') ? '#818cf8' : note.color.includes('yellow') ? '#fcd34d' : note.color.includes('emerald') ? '#34d399' : '#c084fc' }}>Highlight</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium opacity-20" style={{ color: isDark ? '#fff' : '#000' }}>
                            {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-[13px] leading-relaxed font-medium italic" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                        "{note.text}"
                      </p>
                    </div>

                    {/* Note Input Section */}
                    <div className="p-5 flex flex-col gap-4">
                      <div className="relative">
                        <textarea
                          value={note.note}
                          onChange={(e) => setNotesState(prev => prev.map(n => n.id === note.id ? {...n, note: e.target.value} : n))}
                          placeholder="What did you learn from this? Add a note..."
                          className="w-full transition-all outline-none rounded-xl p-4 text-xs resize-none min-h-[100px] leading-relaxed custom-scrollbar shadow-inner"
                          style={{
                             backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
                             border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                             color: isDark ? '#fff' : '#000',
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-bold tracking-tight uppercase" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
                             {note.lessonTitle || 'Section Content'}
                          </span>
                        </div>
                        <button 
                          onClick={() => setNotesState(prev => prev.filter(n => n.id !== note.id))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-wider"
                          style={{ color: 'rgba(239, 68, 68, 0.5)' }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer Summary */}
            {notesState.length > 0 && (
              <div className="px-7 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                  Total of {notesState.length} insights
                </span>
                <div className="flex -space-x-1.5 overflow-hidden">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="w-5 h-5 rounded-full bg-indigo-500/20 border border-[#0d1117]" />
                   ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
