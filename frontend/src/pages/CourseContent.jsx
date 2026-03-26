import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import QuizModal from "../components/QuizModal";

/* ── Performance Optimization: Memoized HTML Content ── */
const MemoizedProseContent = memo(({ html, innerRef }) => (
  <div
    ref={innerRef}
    className="prose-content prose-card selectable-text"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));
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
  "vectorless-rag": "/cources/generative-ai/vectorless-rag/vector_less_rag.html",
  "mcp": "/cources/generative-ai/mcp/MCP.html",
  "docformer": "/courses/ingerstion/docformer_enhanced (1).html",
  "doc-to-image": "/cources/generative-ai/RAG/document-ingestion/document_to_image.html",
  "infonce": "/cources/generative-ai/RAG/document-ingestion/InfoNCE (Noise-Contrastive Estimation).html",
  "max-seq": "/cources/generative-ai/RAG/document-ingestion/maxiamal_sequential_pattern.html",
  "ocr-layout": "/cources/generative-ai/RAG/document-ingestion/ocr_Text_layout_Recognition.html",
  "ocr-text": "/cources/generative-ai/RAG/document-ingestion/ocr_Text_Recognition.html",
  "video-ingestion": "/courses/ingerstion/Videoingestion.html",
  "rag-intro": "/cources/generative-ai/RAG/rag_introduction.html",
  "rag-phases": "/cources/generative-ai/RAG/phases_of_rag.html",
  "rag-database": "/cources/generative-ai/RAG/database.html",
  "rag-prompt-eng": "/courses/Prompt_Engineering_Moduless.html",
  "rag-api": "/cources/generative-ai/RAG/mastering the llm and apis.html",
  "ds-python": "/cources/Data_Science/python.html",
  "multimodal-rag": "/cources/generative-ai/Multi-modal-rag/Introduction to Multimodal AI.html",
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
  "ds-static-propability": "/cources/Data_Science/stats-prob/module_1_and_2.html",
  "dl-preliminaries": "/cources/Data_Science/DL/Preliminaries.html",
  "dl-perceptron": "/cources/Data_Science/DL/perceptronFF.html",
  "dl-rnn": "/cources/Data_Science/DL/RNN_.html",
  "dl-attention": "/cources/Data_Science/DL/Attention_transformers_with_examples.html",
  "dl-gan": "/cources/Data_Science/DL/GAN.html",
  "dl-linear-reg": "/cources/Data_Science/DL/Linear_regresssion_DL.html",
  "dl-gaussian": "/cources/Data_Science/DL/GaussianProcesses.html",
  "dl-comp-perf": "/cources/Data_Science/DL/Computational_Performance.html",
  "dl-opt-techniques": "/cources/Data_Science/DL/Optimization_technique.html",
  "dl-classification": "/cources/Data_Science/DL/Classification_with_examples.html",
  "dl-cv-blog": "/cources/Data_Science/DL/CNN.html",
  "dl-builder-guide": "/cources/Data_Science/DL/builderGuide_with_examples.html",
  "dl-ml-blog": "/cources/Data_Science/DL/NLP.html",
  "clustering-part1": "/courses/clustering/CLUSTERING_PART_0_3.html",
  "clustering-part4": "/courses/clustering/CLUSTERING PART 4.html",
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

  // ── Step 1.5: Fix Squished Code Blocks from Mammoth Tables ──
  doc.querySelectorAll("table").forEach((table) => {
    const rawHtml = table.innerHTML;
    // Heuristic: If it has zero <th>, and contains dense python keywords or <strong>def</strong>
    const hasTh = table.querySelector("th") !== null;
    const isCode = !hasTh && (
      /importtorch|<strong>def<\/strong>|import |def |class |for |while |return |loss\.|opt\.|model\(|torch\.|nn\./i.test(rawHtml)
    );

    if (isCode) {
      const tempDiv = doc.createElement("div");
      tempDiv.innerHTML = rawHtml
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n");
      
      let codeText = tempDiv.textContent || "";
      codeText = codeText
        .replace(/importtorch/g, "import torch ")
        .replace(/fromtorch/g, "from torch ")
        .replace(/importmatplotlib/g, "import matplotlib ")
        .replace(/importmath/g, "import math ")
        .replace(/deftrain/g, "def train")
        .replace(/defevaluate/g, "def evaluate")
        .replace(/defdebug/g, "def debug")
        .replace(/classHR/g, "class HR")
        .replace(/classEarly/g, "class Early")
        .replace(/forX_/g, "for X_")
        .replace(/fory_/g, "for y_")
        .replace(/for_/g, "for _ ")
        .replace(/returnself/g, "return self")
        .replace(/returntotal/g, "return total")
        .replace(/optimizer\.step\(\)/g, "optimizer.step()\n")
        .replace(/loss\.backward\(\)/g, "loss.backward()\n")
        .replace(/opt\.zero_grad\(\)/g, "opt.zero_grad()\n")
        .replace(/model\.train\(\)/g, "model.train()\n")
        .replace(/model\.eval\(\)/g, "model.eval()\n")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();

      // Basic regex syntax highlighting
      const highlighted = codeText
        .replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\b(def|class|import|from|return|for|in|if|else|elif|with|as|pass|break|continue)\b/g, '<span class="text-pink-400">$1</span>')
        .replace(/\b(self|True|False|None)\b/g, '<span class="text-indigo-400">$1</span>')
        .replace(/\b(torch|nn|F|optim|plt|math)\b/g, '<span class="text-emerald-400">$1</span>')
        .replace(/([a-zA-Z_]+)(?=\()/g, '<span class="text-sky-400">$1</span>')
        .replace(/(#.*)/g, '<span class="text-slate-500 italic">$1</span>');

      const wrapper = doc.createElement("div");
      wrapper.className = "my-8 rounded-xl overflow-hidden bg-[#0d1117] border border-slate-800 shadow-2xl font-mono text-sm";
      wrapper.innerHTML = `
        <div class="flex items-center px-4 py-2.5 bg-[#161b22] border-b border-slate-800">
          <div class="flex space-x-2">
            <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span class="ml-4 text-xs tracking-wider text-slate-400 font-sans capitalize">Code Snippet</span>
        </div>
        <pre class="p-5 overflow-x-auto text-slate-300 leading-relaxed whitespace-pre-wrap">${highlighted}</pre>
      `;
      
      table.replaceWith(wrapper);
    }
  });

  // ── Step 2: Determine which heading tags are "main topic" vs "sub topic" ──
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

  /* ── Resolve course-specific config (for HTML-backed courses) ── */
  const courseConfig = COURSE_CONFIGS[id] ?? null;
  const activeLessons = courseConfig ? courseConfig.lessons : LESSONS;

  const [lessons, setLessons] = useState(activeLessons);
  const [currentLesson, setLesson] = useState(activeLessons[0]?.id ?? 1);
  const [activeSubTopic, setSubTopic] = useState(null);
  const [expandedLesson, setExpanded] = useState(activeLessons[0]?.id ?? 1);
  const [sidebarOpen, setSidebar] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);

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
    setShowQuiz(false);
    setQuizData(null);
  }, [id]);

  /* ── HTML-doc course support ── */
  const htmlFile = COURSE_HTML_MAP[id] ?? null;
  const [docHtml, setDocHtml] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!htmlFile) { setDocHtml(""); setTocItems([]); setRawTocItems([]); setReadTime(0); return; }
    setDocLoading(true);
    fetch(htmlFile)
      .then((r) => r.text())
      .then((raw) => {
        const { html, toc, rawToc, readTime: rt } = processHtml(raw);
        setDocHtml(html);
        
        const quizFilePath = htmlFile.replace('.html', '_quiz.json');
        fetch(quizFilePath)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('No quiz');
          })
          .then(qJson => {
            setQuizData(qJson);
            const quizLesson = {
              id: "module-quiz",
              title: "Module Quiz",
              duration: "10m",
              type: "Practice",
              completed: false,
              subTopics: [],
              isQuiz: true
            };
            const updatedToc = [...toc, quizLesson];
            setTocItems(updatedToc);
            setLessons(updatedToc);
            if (toc.length > 0) {
              setLesson(toc[0].id);
              setExpanded(toc[0].id);
            }
          })
          .catch(() => {
            setQuizData(null);
            setTocItems(toc);
            setLessons(toc);
            if (toc.length > 0) {
              setLesson(toc[0].id);
              setExpanded(toc[0].id);
            }
          })
          .finally(() => {
            setRawTocItems(rawToc);
            setReadTime(rt);
            setDocLoading(false);
          });
      })
      .catch(() => { setDocHtml("<p>Failed to load content.</p>"); setDocLoading(false); });
  }, [htmlFile]);

  /* Auto-dismiss chapter card on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setFocusMode(false); setChapterCard(c => ({ ...c, visible: false })); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    if (l.isQuiz) {
      setShowQuiz(true);
      return;
    }
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
            onClick={() => navigate("/courses")}
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

        {/* ── Glassmorphic lesson cards ── */}
        <div className="flex-1 overflow-y-auto py-5 px-4 custom-scrollbar space-y-4">
          {lessons.map((l) => {
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

            return (
              <div
                key={l.id}
                className="relative rounded-2xl border overflow-hidden transition-all duration-300"
                style={{
                  background: isActive ? "var(--color-surface-hover)" : "var(--color-surface)",
                  borderColor: isActive ? "var(--color-primary-text)" : "var(--color-border)",
                  boxShadow: isActive ? "0 8px 30px rgba(0,0,0,0.06)" : "0 2px 10px rgba(0,0,0,0.02)",
                  transform: isActive ? "scale(1.005)" : "scale(1)"
                }}
              >
                {/* ── Main Module Header ── */}
                <button
                  onClick={() => handleLessonClick(l)}
                  className="w-full flex items-center gap-4 p-4 text-left transition-colors relative z-10"
                >
                  {/* Completion Ring */}
                  <div className="relative flex-shrink-0 flex items-center justify-center w-9 h-9">
                    {progressPct === 100 ? (
                      <CheckCircle2 size={18} style={{ color: "var(--color-primary-text)" }} />
                    ) : (
                      <>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="16" stroke="var(--color-border)" strokeWidth="2.5" fill="none" />
                          <circle
                            cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="3" fill="none"
                            strokeDasharray="100.5" strokeDashoffset={100.5 - (100.5 * progressPct) / 100}
                            className="transition-all duration-700 ease-out"
                            style={{ color: "var(--color-primary-text)" }}
                          />
                        </svg>
                        {isActive && <PlayCircle size={14} className="animate-pulse" style={{ color: "var(--color-primary-text)" }} />}
                      </>
                    )}
                  </div>

                  {/* Title + Meta */}
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-sm font-bold truncate transition-colors duration-200"
                      style={{ color: isActive ? "var(--color-primary-text)" : "var(--color-muted-text)" }}
                    >
                      {l.title}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold tracking-wide uppercase opacity-70" style={S.muted}>
                      <Clock size={10} /> {l.duration} {l.type ? `· ${l.type}` : ""}
                    </span>
                  </span>

                  {/* Chevron Toggle */}
                  {hasSubTopics && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isExpanded ? "var(--color-primary-text)" : "transparent",
                        color: isExpanded ? "var(--color-app-bg)" : "var(--color-muted-text)",
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
        <div className="p-4 border-t flex-shrink-0" style={S.border}>
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

        {/* ── Cinematic Chapter Card ── */}
        {htmlFile && chapterCard.visible && (
          <div
            className="chapter-card-overlay"
            onClick={() => setChapterCard(c => ({ ...c, visible: false }))}
          >
            <div className="chapter-card-content" onClick={e => e.stopPropagation()}>
              <span className="chapter-card-label">Section {chapterCard.index}</span>
              <h2 className="chapter-card-title">{chapterCard.title}</h2>
              <div className="chapter-card-line" />
            </div>
          </div>
        )}

        {/* ── Milestone Toast ── */}
        {htmlFile && toast.visible && (
          <div className="milestone-toast" onClick={() => setToast(t => ({ ...t, visible: false }))}>
            <span className="milestone-toast-icon">{toast.icon}</span>
            <span className="milestone-toast-msg">{toast.msg}</span>
          </div>
        )}

        {/* Top bar */}
        {!focusMode && (
          <header
            className="flex-shrink-0 h-14 flex items-center justify-between px-4 sm:px-6 border-b gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
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
                  className="hidden lg:flex p-1.5 rounded-lg transition-colors flex-shrink-0"
                  onClick={() => setSidebarCollapsed(v => !v)}
                  style={S.muted}
                  title={sidebarCollapsed ? "Show course outline" : "Hide course outline"}
                  onMouseEnter={hoverSurface}
                  onMouseLeave={hoverClear}
                >
                  <Menu size={18} />
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs min-w-0" style={S.muted}>
                <span className="hidden sm:block truncate">Generative AI</span>
                <ChevronRight size={12} className="hidden sm:block flex-shrink-0" />
                <span className="font-semibold truncate" style={S.primary}>
                  Lesson {lesson?.title}
                  {activeSubTopic && (
                    <span style={S.muted}> › {lesson?.subTopics?.find(s => s.id === activeSubTopic)?.title}</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setFocusMode(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                style={{ borderColor: "var(--color-border)", ...S.muted, background: "transparent" }}
                onMouseEnter={hoverSurface}
                onMouseLeave={hoverClear}
                title="Enter Focus Mode"
              >
                <Maximize2 size={13} /> Focus Mode
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

              {/* Hero Banner */}
              {!focusMode && courseConfig && (
                <div className="course-hero-banner">
                  <div className="hero-orb hero-orb-1" />
                  <div className="hero-orb hero-orb-2" />
                  <div className="hero-orb hero-orb-3" />
                  <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 pt-14 pb-12">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="hero-category-pill">✦ {courseConfig.category}</span>
                    </div>
                    <h1 className="hero-course-title">{courseConfig.title}</h1>
                    <p className="hero-course-subtitle">
                      {courseConfig.subtitle || "An expertly crafted document course — read at your own pace and master every concept."}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                      {[
                        { icon: "📚", label: `${courseConfig.lessons.length} Section${courseConfig.lessons.length !== 1 ? "s" : ""}` },
                        { icon: "⏱️", label: readTime > 0 ? `~${readTime} min read` : "Calculating…" },
                        { icon: "📖", label: "Full Document" },
                        { icon: "🏆", label: "Certificate Included" },
                      ].map((s) => (
                        <span key={s.label} className="hero-stat-chip">{s.icon} {s.label}</span>
                      ))}
                    </div>
                    <button
                      className="start-reading-btn"
                      onClick={() => {
                        const scrollEl = scrollContainerRef.current;
                        const banner = scrollEl?.querySelector(".course-hero-banner");
                        const offset = banner ? banner.offsetHeight : 300;
                        scrollEl?.scrollTo({ top: offset, behavior: "smooth" });
                      }}
                    >
                      Start Reading ↓
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
      {showQuiz && <QuizModal quizData={quizData} onClose={() => setShowQuiz(false)} />}
    </div>
  );
}
