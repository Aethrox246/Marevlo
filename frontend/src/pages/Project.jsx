import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, Eye, Heart, Clock, ExternalLink, Github, Download, X,
    Zap, Star, TrendingUp, ChevronDown, Filter, BookOpen, Layers,
    Cpu, BarChart2, MessageSquare, Globe, SlidersHorizontal, Award,
    ArrowUpRight, Code2, Database, Brain, Sparkles, FileText, Target,
    CheckCircle, FlaskConical, GraduationCap, ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ─── Notebook URL (driven by env var, no hardcoding) ────────────────────────
const NOTEBOOK_URL = import.meta.env.VITE_NOTEBOOK_URL || '/notebook';

// ─── Project Data ───────────────────────────────────────────────────────────
const PROJECTS_DATA = [
    {
        id: 1,
        title: 'Mental Health Detection from Social Media',
        description: 'A fine-tuned BERT-based transformer that reads social media posts and detects deteriorating mental health — a smoke detector for the mind.',
        longDescription: 'Every day, millions of people post about depression, anxiety, and hopelessness on Reddit, Twitter, and other social platforms — often before they ever tell a doctor or loved one. Existing systems either catch too little (missing real crises) or trigger too many false alarms (burning out mental health workers). This project builds a reliable, explainable AI that reads social media posts and detects deteriorating mental health early enough for an intervention to help.',
        thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=340&fit=crop',
        tags: ['NLP', 'Deep Learning', 'BERT', 'Advanced'],
        category: 'NLP',
        views: 8269,
        likes: 623,
        lastUpdated: 'Active',
        techStack: ['Python', 'RoBERTa', 'MentalBERT', 'SHAP', 'SMOTE', 'HuggingFace'],
        githubUrl: '#',
        colabUrl: NOTEBOOK_URL,
        featured: true,
        question: 'Can a fine-tuned BERT-based transformer model, trained on multi-source Reddit mental health data (depression, SuicideWatch, anxiety subreddits) with temporal posting behaviour features, detect multi-class mental health states — ranging from healthy, to mild distress, to active crisis — with macro-F1 ≥ 0.85 and a false negative rate on active crisis posts ≤ 10%, while providing SHAP-based word-level explanations that a clinician can understand and trust?',
        methodology: [
            'Gather posts from Reddit communities: r/depression, r/SuicideWatch, r/anxiety (distressed labels) and r/happy or r/CasualConversation (healthy baseline). Each post gets a label: 0 = healthy, 1 = mild, 2 = moderate, 3 = crisis.',
            'Clean the text. Remove usernames (@user), URLs, and special characters. Keep emoticons — they carry emotional meaning. Tokenise using the BERT tokenizer.',
            'Fine-tune a pre-trained RoBERTa or MentalBERT model on the classification task (~30 minutes on free Google Colab GPU).',
            'Add temporal features: track post frequency per week, average sentiment score per week, and whether sentiment is trending downward. Combine with text model using late-fusion.',
            'Handle class imbalance: active crisis posts are rare. Use SMOTE or generate synthetic examples using GPT-4 to balance the classes.',
            'Add SHAP explanations: for each prediction, SHAP highlights which words contributed most (e.g., "worthless," "no point," "can\'t sleep").',
            'Evaluate on a held-out test set AND on an external dataset the model has never seen (cross-domain test).',
        ],
        datasets: [
            { name: 'thePixel42/depression-detection', source: 'HuggingFace', desc: '200,000 labelled posts from r/teenagers, r/SuicideWatch, r/depression', url: 'https://huggingface.co/datasets/thePixel42/depression-detection' },
            { name: 'mrjunos/depression-reddit-cleaned', source: 'HuggingFace', desc: '7,000 cleaned Reddit posts; best beginner starting point', url: 'https://huggingface.co/datasets/mrjunos/depression-reddit-cleaned' },
            { name: 'solomonk/reddit_mental_health_posts', source: 'HuggingFace', desc: 'Multi-subreddit mental health posts', url: 'https://huggingface.co/datasets/solomonk/reddit_mental_health_posts' },
            { name: 'andreagasparini/dreaddit', source: 'HuggingFace', desc: '3,500 human-annotated Reddit stress segments from 5 categories', url: 'https://huggingface.co/datasets/andreagasparini/dreaddit' },
            { name: 'irlab-udc/redsm5', source: 'HuggingFace', desc: '1,484 Reddit posts annotated sentence-by-sentence by a licensed psychologist for all 9 DSM-5 depression symptoms', url: 'https://huggingface.co/datasets/irlab-udc/redsm5' },
            { name: 'MentalRoBERTa Pre-trained Model', source: 'HuggingFace', desc: 'A BERT model already fine-tuned on mental health corpora', url: '#' },
        ],
        papers: [
            'Detection of Depression Severity Using Transformer-Based Models — MDPI Information, 2025',
            'Deep Learning-Based Detection of Depression and Suicidal Tendencies — PMC, 2025',
            'Advancing Mental Disorder Detection: Transformers vs LSTM — arXiv, 2025',
            'Early Detection of Mental Health Crises via AI Analysis — PMC, 2024',
            'Exploring Emotional Patterns via NLP for Mental Health — PMC, 2025',
        ],
        evaluation: [
            'Macro-F1 score (measures performance evenly across all severity levels)',
            'Recall on crisis class specifically (missing a real crisis is the most dangerous error)',
            'False Positive Rate (flagging healthy posts wastes clinical resources)',
            'SHAP explanation quality: do highlighted words align with what a psychologist would look at?',
            'Cross-domain generalisation: train on Reddit, test on a different platform',
        ],
        minimumScore: 'Macro-F1 ≥ 0.85 | Crisis Recall ≥ 90% | False Negative Rate ≤ 10% | SHAP agreement ≥ 80% | Cross-domain F1 degradation ≤ 15%',
        dataExplanation: 'Each sample is one Reddit post (a paragraph of free text) with a label indicating mental health status. Labels range from healthy to crisis. Some datasets include multiple posts per user over time for temporal trend analysis. The main challenge is class imbalance: around 3–5% of posts reflect active crisis. Text is informal, has misspellings, slang, and code-switched language.',
    },
    {
        id: 2,
        title: 'Gut Health Prediction from Diet Patterns',
        description: 'A Hypergraph Neural Network that models food–microbiome–disease relationships to predict whether a diet will shift your gut toward disease risk.',
        longDescription: 'Your gut contains trillions of bacteria — your microbiome — and what you eat directly shapes which bacteria thrive. The right microbiome protects you from diabetes, IBS, obesity, and even depression. This project uses a Graph Neural Network to model the complex web-like relationships between 500+ bacterial species and hundreds of food components simultaneously.',
        thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=340&fit=crop',
        tags: ['Deep Learning', 'GNN', 'Bioinformatics', 'Advanced'],
        category: 'Graph Neural Networks',
        views: 6340,
        likes: 489,
        lastUpdated: 'Active',
        techStack: ['Python', 'PyTorch Geometric', 'HyperGNN', 'NetworkX', 'Scikit-learn'],
        githubUrl: '#',
        colabUrl: NOTEBOOK_URL,
        featured: true,
        question: 'Can a hypergraph neural network trained on a food–microbiome–disease association database predict whether a given 7-day dietary pattern will shift a person\'s microbiome toward a disease-risk profile (e.g., low Firmicutes/Bacteroidetes ratio associated with obesity), with an AUC-ROC ≥ 0.82 and AUPR ≥ 0.78 on held-out test subjects?',
        methodology: [
            'Think of this as a network (graph) problem. Nodes: food items, bacterial species, and diseases. Edges: known interactions like "eating brown rice increases Lactobacillus, which reduces diabetes risk."',
            'Build the graph from published literature and databases (FMD database — 190 foods, 219 microbes, 163 diseases).',
            'Use a Hypergraph Neural Network (HyperGNN): a hyperedge connects three or more nodes at once (food A + microbe B → disease C), modelling real tripling interactions.',
            'For a specific patient, represent their 7-day diet as a feature vector (foods, quantities, time of day). Feed into the trained HyperGNN.',
            'The model outputs: "This dietary pattern pushes your microbiome toward a Firmicutes-dominant state, associated with 67% increased obesity risk." Graph attention weights provide explanation.',
            'Validate on held-out subjects from a real dietary intervention study (pre-intervention vs. post-intervention microbiome samples).',
        ],
        datasets: [
            { name: 'American Gut Project', source: 'GitHub', desc: 'Largest public microbiome dataset; 15,000+ subjects with diet questionnaires and 16S sequencing', url: 'https://github.com/biocore/American-Gut' },
            { name: 'Human Microbiome Project', source: 'AWS Open Data', desc: 'NIH-funded reference dataset of 300 healthy adults, 18 body sites', url: '#' },
            { name: 'Gut Microbiome-Metabolome Collection', source: 'Nature npj', desc: 'Paired microbiome + metabolome data from multiple cohorts', url: '#' },
            { name: 'Human Microbiome Compendium', source: 'microbiomap.org', desc: 'Largest harmonised public microbiome dataset — 168,000 samples', url: '#' },
            { name: 'OpenFoodFacts', source: 'openfoodfacts.org', desc: '3 million+ foods with full nutritional breakdown; use to build food nodes', url: 'https://open.openfoodfacts.org' },
        ],
        papers: [
            'Graph Neural Networks for Gut Microbiome Metaomic Data — arXiv, 2024',
            'SIMBA-GNN: Mechanistic Graph Learning for Microbiome — Nature npj, 2025',
            'Lightweight Hypergraph Neural Network for Food–Microbe–Disease — BMC Bioinformatics, 2025',
            'Deep Learning in Microbiome Analysis: Comprehensive Review — Frontiers in Microbiology, 2025',
            'Predicting Metabolite Response to Dietary Intervention — Nature Communications, 2025',
        ],
        evaluation: [
            'AUC-ROC (overall discriminative ability across all microbiome-phenotype pairs)',
            'AUPR — Area Under Precision-Recall Curve (more informative when data is sparse and imbalanced)',
            'Mean Reciprocal Rank (how well does the model rank true disease-microbe associations)',
            'Explanation quality: do attention weights highlight biologically relevant species and food items?',
        ],
        minimumScore: 'AUC-ROC ≥ 0.82 | AUPR ≥ 0.78 | MRR ≥ 0.65 on held-out food-microbe-disease triplets',
        dataExplanation: 'Microbiome data is a table where each row is a person, each column is a bacterial species, and values are relative abundances. Diet data is a log of what the person ate for how many days. The challenge is sparsity — most people have not been measured for all 500+ bacterial species.',
    },
    {
        id: 3,
        title: 'Student Knowledge State Tracking',
        description: 'An LSTM-based Deep Knowledge Tracing model with forgetting mechanism and concept graphs — a GPS for learning that predicts what a student knows and is about to forget.',
        longDescription: 'Imagine a maths tutoring app that, after watching a student answer 20 questions, knows exactly which concepts they understand and which they are about to forget — and then chooses the perfect next question to maximise learning. This project builds Deep Knowledge Tracing (DKT) enhanced with forgetting curves and prerequisite concept graphs.',
        thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop',
        tags: ['Deep Learning', 'LSTM', 'EdTech', 'Advanced'],
        category: 'Deep Learning',
        views: 5570,
        likes: 402,
        lastUpdated: 'Active',
        techStack: ['Python', 'PyTorch', 'LSTM', 'pyKT', 'Graph Attention', 'Scikit-learn'],
        githubUrl: '#',
        colabUrl: NOTEBOOK_URL,
        featured: false,
        question: 'Can a Deep Knowledge Tracing model enhanced with a forgetting mechanism (Ebbinghaus\' forgetting curve), a prerequisite concept graph, and a student-level learning rate estimator, predict whether a student will answer the next question correctly with AUC ≥ 0.87 and outperform baseline DKT by ≥ 5% AUC, while providing skill-level mastery estimates that match expert teacher judgements?',
        methodology: [
            'Represent each student\'s learning history as a sequence: [(question 1, concept: addition, correct), (question 2, concept: subtraction, wrong), …]. Each event has a timestamp.',
            'Train the base LSTM-DKT: reads the sequence left to right, updating a hidden "knowledge state" vector after each answer. Output: probability of answering the next question correctly.',
            'Add a forgetting module: use exponential decay (Ebbinghaus\' forgetting curve) to reduce knowledge state for concepts not practised recently.',
            'Build a concept dependency graph: "you need multiplication before division." Add Graph Attention layer to modify concept relationships in the LSTM hidden state.',
            'For cold-start students (very few interactions), use LLM-based prior knowledge estimation with 3 diagnostic questions.',
            'Evaluate with AUC on next-question prediction AND skill-level accuracy (does the model\'s mastery score for "fractions" match what a teacher would say?).',
        ],
        datasets: [
            { name: 'ASSISTments/FoundationalASSIST', source: 'HuggingFace', desc: '1.7M student interactions, 5,000 students, complete problem text', url: 'https://huggingface.co/datasets/ASSISTments/FoundationalASSIST' },
            { name: 'ASSISTments 2009-2010', source: 'Official Site', desc: '346,860 interactions, 4,217 students; gold standard DKT benchmark', url: '#' },
            { name: 'ASSISTments 2015', source: 'Official Site', desc: '708,631 interactions, 19,917 students, 100 skills', url: '#' },
            { name: 'EdNet Dataset', source: 'GitHub (riiid)', desc: 'Largest education dataset: 131M interactions, TOEIC preparation', url: 'https://github.com/riiid/ednet' },
            { name: 'pyKT Python Toolkit', source: 'GitHub', desc: '10+ DKT models implemented (DKT, DKVMN, SAKT, AKT, SimpleKT), 7 datasets pre-integrated', url: 'https://github.com/pykt-team/pykt-toolkit' },
        ],
        papers: [
            'Deep Knowledge Tracing — Stanford, Piech et al. (original foundational paper)',
            'Deep Learning Based Knowledge Tracing: A Review — ACM, 2025',
            'Deep Knowledge Tracing and Cognitive Load Estimation — Nature Scientific Reports, 2025',
            'DKT2: Improved Deep Knowledge Tracing — arXiv, 2025',
            'Practical Evaluation of DKT Models — EDM 2025',
        ],
        evaluation: [
            'AUC-ROC on binary prediction (correct vs. wrong) — main metric',
            'Accuracy (% of next-question predictions that are correct)',
            'Knowledge state interpretability: does concept-level mastery match teacher ratings?',
            'Cold-start performance: AUC for students with fewer than 10 prior interactions',
            'Forgetting simulation accuracy: does predicted mastery decay match observed re-test performance?',
        ],
        minimumScore: 'AUC-ROC ≥ 0.87 on ASSISTments 2015 | ≥ 5% AUC improvement over baseline DKT | Cold-start AUC ≥ 0.78',
        dataExplanation: 'Each row is one student answering one question: student_id, question_id, skill_concept, correctness (1/0), timestamp. The model reads these in time order per student. Key challenge: some students answer 5 questions, others answer 5,000 — the model must work well across both.',
    },
    {
        id: 4,
        title: 'Financial Document Understanding',
        description: 'A LayoutLMv3-powered system that reads both the words AND their 2D positions on financial documents to extract structured data from annual reports, balance sheets, and tax filings.',
        longDescription: 'Financial documents are not just text — they are a mix of text, tables, numbers, and visual layouts. A regular BERT model reads them like a blind person: it gets the words but misses that "Revenue: $12M" is in the top-right corner of a table in bold. LayoutLMv3 reads both the words AND where they are positioned on the page AND what they look like visually.',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
        tags: ['NLP', 'Document AI', 'LayoutLM', 'Advanced'],
        category: 'NLP',
        views: 4130,
        likes: 319,
        lastUpdated: 'Active',
        techStack: ['Python', 'LayoutLMv3', 'Tesseract OCR', 'HuggingFace', 'DocTR', 'SEC EDGAR'],
        githubUrl: '#',
        colabUrl: NOTEBOOK_URL,
        featured: true,
        question: 'Can a fine-tuned LayoutLMv3 model, trained on public financial form datasets and SEC EDGAR annual reports, extract key financial entities (revenue, EBITDA, debt-to-equity ratio, risk factors) from unseen company filings — including multi-page, multi-table documents — with entity-level F1 ≥ 0.88 and table cell extraction accuracy ≥ 85%, generalising across at least 3 different unseen document layouts?',
        methodology: [
            'Take a scanned or digital PDF. Run OCR (Tesseract or DocTR) to extract each word plus its bounding box coordinates (x, y, width, height on the page).',
            'Feed each token into LayoutLMv3 with three inputs: (a) the word itself, (b) its 2D position, (c) an image patch of the page region. The model learns that words in table headers have a different meaning than body text.',
            'Fine-tune on labelled NER dataset: each word labelled as "B-REVENUE", "I-REVENUE", "B-RISK", etc. using standard IOB labelling scheme.',
            'For multi-page documents, use chunking: process each page independently, then use cross-page attention to resolve references across pages ("see Note 14").',
            'Evaluate on unseen company filings from sectors not in training (e.g., train on tech, test on pharmaceutical).',
        ],
        datasets: [
            { name: 'FUNSD Dataset', source: 'Official', desc: '199 annotated scanned forms; the primary LayoutLM benchmark', url: 'https://guillaumejaume.github.io/FUNSD' },
            { name: 'FUNSD (LayoutLMv2 format)', source: 'HuggingFace', desc: 'Same FUNSD pre-formatted for LayoutLM; load in one line', url: '#' },
            { name: 'SEC EDGAR Full-Text Search', source: 'US SEC Official', desc: 'Annual reports (10-K) from all US-listed companies; downloadable in HTML/XBRL', url: '#' },
            { name: 'FinanceBench', source: 'GitHub (patronus-ai)', desc: '150 financial QA pairs over real SEC filings with verified ground-truth', url: 'https://github.com/patronus-ai/financebench' },
            { name: 'DocVQA Dataset', source: 'HuggingFace', desc: '50,000 QA pairs over document images; broad document understanding benchmark', url: '#' },
        ],
        papers: [
            'LayoutLM: Pre-training of Text and Layout for Document Image Understanding — Microsoft Research',
            'LayoutLMv3 — HuggingFace / Microsoft (official model, handles text+layout+image)',
            'NLP in Finance: A Comprehensive Survey — ScienceDirect / Information Fusion, 2024',
            'LLMs for Financial Document Analysis — IntuitionLabs, 2025',
            'Large Language Models in Finance (FinLLMs Survey) — Neural Computing, 2025',
        ],
        evaluation: [
            'Entity-level F1 score (precision and recall on extracting financial entities)',
            'Table cell extraction accuracy (did it read the right cell from the right row?)',
            'Cross-layout generalisation: performance on document layouts not seen during training',
            'End-to-end QA accuracy (given a filing, can it answer "What was the 2024 revenue?")',
            'Hallucination rate: does the model ever extract a number not in the document?',
        ],
        minimumScore: 'Entity-level F1 ≥ 0.88 on FUNSD | Table extraction accuracy ≥ 85% | Cross-layout F1 degradation ≤ 8%',
        dataExplanation: 'Each training sample is a document image (or PDF page) paired with word-level annotations: bounding boxes for every word, plus entity labels. Financial documents are tricky because the same concept (e.g., "Net Revenue") appears in different positions and formats across companies.',
    },
    {
        id: 5,
        title: 'Crop Yield Prediction under Climate Variability',
        description: 'A multi-branch CNN+LSTM model that fuses satellite imagery and weather time series to predict district-level crop yield 30+ days before harvest — even in climate-volatile years.',
        longDescription: 'A farmer needs to know before harvest: will the yield be good or bad this year? AI models trained on US or European farms fail on Indian farms because climate, crop variety, and farming practices are completely different. This project builds a CNN that reads satellite images (crop health from space) while an LSTM tracks how conditions evolved over the growing season.',
        thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=340&fit=crop',
        tags: ['Deep Learning', 'Computer Vision', 'LSTM', 'Advanced'],
        category: 'Computer Vision',
        views: 5910,
        likes: 441,
        lastUpdated: 'Active',
        techStack: ['Python', 'ResNet-18', 'LSTM', 'Sentinel-2', 'Google Earth Engine', 'NASA POWER API'],
        githubUrl: '#',
        colabUrl: NOTEBOOK_URL,
        featured: false,
        question: 'Can a multi-branch deep learning model that fuses: (a) multi-temporal Sentinel-2 satellite image patches through a CNN, with (b) meteorological time series through an LSTM — predict district-level crop yield for wheat and soybean in Indian states with R² ≥ 0.80 and RMSE ≤ 8% of mean yield, at least 30 days before harvest, and remain stable across years with abnormal rainfall?',
        methodology: [
            'Collect Sentinel-2 satellite images for target region (e.g., Madhya Pradesh) every 14 days during growing season. Each image: 224×224 pixel patch per district with 13 spectral bands.',
            'Compute vegetation indices: NDVI (how green/alive is the crop), EVI (Enhanced), NDRE (Red-Edge, sensitive to chlorophyll). These turn raw satellite bands into meaningful crop health numbers.',
            'Run image patches through a CNN (ResNet-18). The CNN learns spatial features: "this pattern of greenness at mid-season is associated with good yield." Output: feature vector per time step per district.',
            'Collect daily weather data (rainfall, temperature, solar radiation, humidity). Stack as time series. Feed into LSTM that learns temporal patterns like "3 consecutive weeks of drought in March always means yield drop."',
            'Fuse CNN feature vector and LSTM output using multi-head attention. The model learns how much to weight satellite vs. weather at each point in the season.',
            'Train on 5–8 years of historical data. Test on most recent 1–2 years (including an anomalous monsoon year — the climate variability stress test).',
        ],
        datasets: [
            { name: 'CropNet Dataset', source: 'HuggingFace (KDD 2024)', desc: 'Sentinel-2 imagery + meteorology + USDA yield data for 2,291 US counties, 6 years', url: 'https://huggingface.co/datasets/CropNet/CropNet' },
            { name: 'CropNet GitHub', source: 'GitHub', desc: 'Colab tutorials, DataDownloader API, and MMST-ViT baseline model', url: '#' },
            { name: 'Crop Production in India', source: 'Kaggle', desc: 'District-wise, season-wise crop production data for India', url: 'https://kaggle.com/datasets/abhinand05/crop-production-in-india' },
            { name: 'Crop Yield in Indian States', source: 'Kaggle', desc: 'State-level yield data for Indian crops; cleaned and beginner-ready', url: '#' },
            { name: 'NASA POWER Meteorological API', source: 'NASA (free)', desc: 'Daily climate variables for any latitude/longitude on Earth', url: '#' },
            { name: 'Sentinel-2 via Google Earth Engine', source: 'Google (free)', desc: 'Multispectral satellite images globally; accessible from Colab', url: '#' },
        ],
        papers: [
            'Crop Yield Prediction: Comprehensive Review of ML and DL — ScienceDirect, 2024',
            'DeepAgroNet: Predicting Wheat Yield Using Deep Learning — Nature Scientific Reports, 2025',
            'CropNet: Open Dataset for Climate-Aware Crop Yield Predictions — KDD 2024',
            'Deep Learning Based Farm-Level Crop Yield Prediction — ScienceDirect, 2025',
            'Enhanced Wheat Yield via Integrated Climate and Satellite Data — Nature, 2025',
        ],
        evaluation: [
            'R² score (how much yield variance the model explains; 1.0 = perfect)',
            'RMSE as % of mean yield (normalised RMSE; easier to interpret across crops)',
            'Lead time: how early before harvest can the model reach its target accuracy?',
            'Climate stress test: R² on years with anomalous rainfall vs. normal years',
            'Cross-region generalisation: train on Gujarat + MP, test on Punjab (unseen state)',
        ],
        minimumScore: 'R² ≥ 0.80 | Normalised RMSE ≤ 8% | Prediction ≥ 30 days before harvest | R² degradation in anomalous years ≤ 10%',
        dataExplanation: 'Satellite data is a 4D tensor: (time, height, width, spectral bands). ~10 image snapshots per district during growing season. Weather data is a 2D time series: (time, weather variable). Crop yield is a single number per district per year (tonnes/hectare). Indian crop data is noisy (survey-based), satellite images have cloud cover in monsoon, and each year\'s climate is different.',
    },
];

// ─── Tag + Category Config ───────────────────────────────────────────────────
const ALL_TAGS = [
    'NLP', 'Deep Learning', 'Computer Vision', 'GNN',
    'BERT', 'LSTM', 'Document AI', 'LayoutLM',
    'Bioinformatics', 'EdTech', 'Advanced',
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'likes', label: 'Most Liked' },
];

// ─── Tag Colour Map ───────────────────────────────────────────────────────────
const TAG_COLORS = {
    'NLP':                { bg: 'rgba(6,182,212,0.12)',   text: '#22d3ee', border: 'rgba(6,182,212,0.3)'  },
    'Deep Learning':      { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    'Computer Vision':    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    'GNN':                { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'BERT':               { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    'LSTM':               { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
    'Document AI':        { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: 'rgba(249,115,22,0.3)' },
    'LayoutLM':           { bg: 'rgba(234,179,8,0.12)',   text: '#fbbf24', border: 'rgba(234,179,8,0.3)'  },
    'Bioinformatics':     { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
    'EdTech':             { bg: 'rgba(251,191,36,0.12)',  text: '#fcd34d', border: 'rgba(251,191,36,0.3)' },
    'Advanced':           { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)'  },
    'PyTorch':            { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)'  },
};

function getTagStyle(tag) {
    return TAG_COLORS[tag] || { bg: 'rgba(161,161,170,0.12)', text: '#a1a1aa', border: 'rgba(161,161,170,0.3)' };
}

// ─── Stat Formatter ──────────────────────────────────────────────────────────
function fmtNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

// ─── Tag Pill ────────────────────────────────────────────────────────────────
function TagPill({ tag, small = false, clickable = false, active = false, onClick }) {
    const s = getTagStyle(tag);
    return (
        <button
            onClick={onClick}
            style={{
                background:   active ? s.text + '22' : s.bg,
                color:        s.text,
                border:       `1px solid ${active ? s.text : s.border}`,
                fontSize:     small ? '0.68rem' : '0.72rem',
                padding:      small ? '2px 8px' : '3px 10px',
                borderRadius: 999,
                fontWeight:   600,
                letterSpacing: '0.02em',
                cursor:       clickable ? 'pointer' : 'default',
                transition:   'all 0.15s',
                outline:      'none',
                whiteSpace:   'nowrap',
                transform:    active ? 'scale(1.03)' : 'scale(1)',
            }}
        >
            {tag}
        </button>
    );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, isDark, onClick }) {
    const [hovered, setHovered] = useState(false);
    const [liked, setLiked] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background:    isDark ? 'var(--color-card-bg)' : '#ffffff',
                border:        `1px solid ${hovered ? (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)') : 'var(--color-border)'}`,
                borderRadius:  '20px',
                overflow:      'hidden',
                cursor:        'pointer',
                transform:     hovered ? 'translateY(-4px)' : 'translateY(0)',
                height:        '100%',
                boxShadow:     hovered
                    ? isDark
                        ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)'
                        : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.1)'
                    : isDark
                        ? '0 2px 12px rgba(0,0,0,0.3)'
                        : '0 2px 12px rgba(0,0,0,0.06)',
                transition:    'all 0.28s cubic-bezier(0.34,1.2,0.64,1)',
                display:       'flex',
                flexDirection: 'column',
                position:      'relative',
            }}
        >
            {/* Featured ribbon */}
            {project.featured && (
                <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                    background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                    borderRadius: 999, padding: '2px 10px',
                    fontSize: '0.62rem', fontWeight: 800, color: '#fff',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
                }}>
                    ⭐ Featured
                </div>
            )}

            {/* Thumbnail */}
            <div style={{ position: 'relative', overflow: 'hidden', height: 180 }}>
                <img
                    src={project.thumbnail}
                    alt={project.title}
                    style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                    }}
                />
                {/* Category badge */}
                <div style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(8px)', borderRadius: 8,
                    padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700,
                    color: isDark ? '#f5f5f5' : '#111',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                }}>
                    {project.category}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{
                    margin: 0, fontSize: '0.97rem', fontWeight: 800,
                    color: 'var(--color-primary-text)', lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                }}>
                    {project.title}
                </h3>
                <p style={{
                    margin: 0, fontSize: '0.8rem', color: 'var(--color-muted-text)',
                    lineHeight: 1.6, display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {project.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                    {project.tags.slice(0, 3).map(t => (
                        <TagPill key={t} tag={t} small />
                    ))}
                </div>

                {/* Stats row */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 'auto', paddingTop: 10,
                    borderTop: `1px solid var(--color-border)`,
                    fontSize: '0.75rem', color: 'var(--color-muted-text)',
                }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={13} /> {fmtNum(project.views)}
                        </span>
                        <button
                            onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'none', border: 'none', padding: 0,
                                color: liked ? '#f87171' : 'var(--color-muted-text)',
                                cursor: 'pointer', fontWeight: liked ? 700 : 400,
                                fontSize: '0.75rem', transition: 'color 0.15s',
                            }}
                        >
                            <Heart size={13} fill={liked ? '#f87171' : 'none'} />
                            {fmtNum(project.likes + (liked ? 1 : 0))}
                        </button>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {project.lastUpdated}
                    </span>
                </div>
            </div>

            {/* View button */}
            <div style={{
                padding: '0 18px 16px',
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.22s ease',
            }}>
                <div style={{
                    width: '100%', textAlign: 'center',
                    padding: '9px',
                    background: isDark
                        ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                        : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    borderRadius: 12, color: '#fff', fontWeight: 700,
                    fontSize: '0.8rem', letterSpacing: '0.02em',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                }}>
                    View Project <ArrowUpRight size={13} style={{ display: 'inline', marginLeft: 4 }} />
                </div>
            </div>
        </div>
    );
}

// ─── Project Modal ────────────────────────────────────────────────────────────
function ProjectModal({ project, isDark, onClose }) {
    useEffect(() => {
        const handle = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
    }, [onClose]);

    if (!project) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'modalFadeIn 0.22s ease-out',
            }}
        >
            <style>{`
                @keyframes modalFadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes modalSlideUp { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
            `}</style>

            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: isDark ? 'var(--color-card-bg)' : '#ffffff',
                    border: `1px solid var(--color-border)`,
                    borderRadius: 28, overflow: 'hidden',
                    maxWidth: 720, width: '100%', maxHeight: '90vh',
                    overflowY: 'auto', position: 'relative',
                    animation: 'modalSlideUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
                    boxShadow: isDark
                        ? '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.2)'
                        : '0 40px 100px rgba(0,0,0,0.2)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16, zIndex: 10,
                        width: 36, height: 36, borderRadius: '50%',
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        border: 'none', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-muted-text)', transition: 'all 0.15s',
                    }}
                >
                    <X size={18} />
                </button>

                {/* Hero image */}
                <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                    <img
                        src={project.thumbnail}
                        alt={project.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: isDark
                            ? 'linear-gradient(to top, var(--color-card-bg) 0%, transparent 60%)'
                            : 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 60%)',
                    }} />
                    {project.featured && (
                        <div style={{
                            position: 'absolute', top: 16, left: 16,
                            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                            borderRadius: 999, padding: '3px 12px',
                            fontSize: '0.68rem', fontWeight: 800, color: '#fff',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                            ⭐ Featured
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '0 28px 28px' }}>
                    {/* Category */}
                    <div style={{ marginBottom: 10 }}>
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: '#6366f1',
                        }}>
                            {project.category}
                        </span>
                    </div>

                    <h2 style={{
                        margin: '0 0 10px', fontSize: '1.55rem', fontWeight: 900,
                        color: 'var(--color-primary-text)', lineHeight: 1.25,
                        letterSpacing: '-0.03em',
                    }}>
                        {project.title}
                    </h2>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.8rem', color: 'var(--color-muted-text)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Eye size={14} /> {fmtNum(project.views)} views
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Heart size={14} /> {fmtNum(project.likes)} likes
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={14} /> {project.lastUpdated}
                        </span>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                        {project.tags.map(t => <TagPill key={t} tag={t} />)}
                    </div>

                    {/* Overview */}
                    <p style={{
                        margin: '0 0 24px', fontSize: '0.9rem', lineHeight: 1.75,
                        color: 'var(--color-muted-text)',
                    }}>
                        {project.longDescription}
                    </p>

                    {/* Research Question */}
                    {project.question && (
                        <div style={{
                            background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 16, padding: '18px 20px', marginBottom: 22,
                            borderLeft: '4px solid #6366f1',
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: '#818cf8', marginBottom: 10,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Target size={13} /> Research Question
                            </div>
                            <p style={{
                                margin: 0, fontSize: '0.85rem', lineHeight: 1.7,
                                color: 'var(--color-primary-text)', fontStyle: 'italic',
                            }}>
                                {project.question}
                            </p>
                        </div>
                    )}

                    {/* Methodology */}
                    {project.methodology && (
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 16, padding: '18px 20px', marginBottom: 22,
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 14,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <FlaskConical size={13} /> Methodology
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {project.methodology.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 900, color: '#fff', marginTop: 2,
                                        }}>
                                            {i + 1}
                                        </div>
                                        <p style={{
                                            margin: 0, fontSize: '0.82rem', lineHeight: 1.65,
                                            color: 'var(--color-muted-text)',
                                        }}>
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Datasets */}
                    {project.datasets && (
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 16, padding: '18px 20px', marginBottom: 22,
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 14,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Database size={13} /> Datasets Available
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {project.datasets.map((ds, i) => (
                                    <a
                                        key={i}
                                        href={ds.url}
                                        onClick={e => e.stopPropagation()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '10px 12px', borderRadius: 10,
                                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            border: '1px solid var(--color-border)',
                                            textDecoration: 'none', transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ flexShrink: 0, marginTop: 2 }}>
                                            <Database size={14} style={{ color: '#06b6d4' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.8rem', fontWeight: 700,
                                                color: 'var(--color-primary-text)', marginBottom: 2,
                                            }}>
                                                {ds.name}
                                                <span style={{
                                                    marginLeft: 8, fontSize: '0.65rem', fontWeight: 600,
                                                    color: '#06b6d4', background: 'rgba(6,182,212,0.1)',
                                                    padding: '1px 6px', borderRadius: 4,
                                                }}>
                                                    {ds.source}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem', color: 'var(--color-muted-text)', lineHeight: 1.5,
                                            }}>
                                                {ds.desc}
                                            </div>
                                        </div>
                                        {ds.url !== '#' && <ArrowUpRight size={14} style={{ color: 'var(--color-muted-text)', flexShrink: 0, marginTop: 2 }} />}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data Explanation */}
                    {project.dataExplanation && (
                        <div style={{
                            background: isDark ? 'rgba(234,179,8,0.06)' : 'rgba(234,179,8,0.05)',
                            border: '1px solid rgba(234,179,8,0.2)',
                            borderRadius: 16, padding: '16px 20px', marginBottom: 22,
                            borderLeft: '4px solid #fbbf24',
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: '#fbbf24', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <FileText size={13} /> Data Explanation
                            </div>
                            <p style={{
                                margin: 0, fontSize: '0.82rem', lineHeight: 1.65,
                                color: 'var(--color-muted-text)',
                            }}>
                                {project.dataExplanation}
                            </p>
                        </div>
                    )}

                    {/* Research Papers */}
                    {project.papers && (
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 16, padding: '18px 20px', marginBottom: 22,
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 12,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <GraduationCap size={13} /> Research Papers Referred
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {project.papers.map((paper, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        fontSize: '0.8rem', color: 'var(--color-muted-text)', lineHeight: 1.5,
                                    }}>
                                        <ChevronRight size={12} style={{ flexShrink: 0, marginTop: 4, color: '#818cf8' }} />
                                        <span>{paper}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Evaluation Criteria */}
                    {project.evaluation && (
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 16, padding: '18px 20px', marginBottom: 22,
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 12,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <BarChart2 size={13} /> Evaluation Criteria
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {project.evaluation.map((crit, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        fontSize: '0.8rem', color: 'var(--color-muted-text)', lineHeight: 1.5,
                                    }}>
                                        <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 4, color: '#34d399' }} />
                                        <span>{crit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Minimum Score */}
                    {project.minimumScore && (
                        <div style={{
                            background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: 16, padding: '16px 20px', marginBottom: 22,
                            borderLeft: '4px solid #34d399',
                        }}>
                            <div style={{
                                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: '#34d399', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Target size={13} /> Minimum Score Required
                            </div>
                            <p style={{
                                margin: 0, fontSize: '0.85rem', lineHeight: 1.65,
                                color: 'var(--color-primary-text)', fontWeight: 600,
                                fontFamily: 'monospace',
                            }}>
                                {project.minimumScore}
                            </p>
                        </div>
                    )}

                    {/* Tech stack */}
                    <div style={{
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 16, padding: '16px 20px', marginBottom: 22,
                    }}>
                        <div style={{
                            fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 10,
                        }}>
                            Tech Stack
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {project.techStack.map(tech => (
                                <span key={tech} style={{
                                    padding: '4px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                                    border: `1px solid var(--color-border)`,
                                    fontSize: '0.78rem', fontWeight: 600,
                                    color: 'var(--color-primary-text)',
                                    fontFamily: 'monospace',
                                }}>
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <a href={project.githubUrl} onClick={e => e.stopPropagation()} style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', borderRadius: 12,
                            background: isDark ? '#ffffff' : '#000000',
                            color: isDark ? '#000000' : '#ffffff',
                            fontWeight: 700, fontSize: '0.82rem',
                            textDecoration: 'none', transition: 'all 0.15s',
                            border: 'none',
                        }}>
                            <Github size={15} /> View on GitHub
                        </a>
                        <a href={project.colabUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', borderRadius: 12,
                            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                            color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                            textDecoration: 'none', border: 'none',
                            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                        }}>
                            <ExternalLink size={15} /> Open Notebook
                        </a>
                        <a href="#" onClick={e => e.stopPropagation()} style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', borderRadius: 12,
                            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                            border: `1px solid var(--color-border)`,
                            color: 'var(--color-primary-text)', fontWeight: 700, fontSize: '0.82rem',
                            textDecoration: 'none',
                        }}>
                            <Download size={15} /> Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ isDark, projects, onProjectClick }) {
    const trending = [...projects].sort((a, b) => b.views - a.views).slice(0, 4);
    const totalViews = projects.reduce((s, p) => s + p.views, 0);
    const totalLikes = projects.reduce((s, p) => s + p.likes, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* My Stats */}
            <div style={{
                background: isDark ? 'var(--color-card-bg)' : '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 20, padding: '20px',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Gradient accent line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg,#6366f1,#06b6d4,#8b5cf6)',
                }} />
                <div style={{
                    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Award size={13} /> My Stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                        { label: 'Projects',    value: projects.length,       color: '#6366f1', icon: <Layers size={15} /> },
                        { label: 'Total Views', value: fmtNum(totalViews),    color: '#06b6d4', icon: <Eye size={15} /> },
                        { label: 'Total Likes', value: fmtNum(totalLikes),    color: '#f87171', icon: <Heart size={15} /> },
                        { label: 'Featured',    value: projects.filter(p => p.featured).length, color: '#f59e0b', icon: <Star size={15} /> },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 12, padding: '12px 10px', textAlign: 'center',
                        }}>
                            <div style={{ color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary-text)', letterSpacing: '-0.02em' }}>
                                {value}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-muted-text)', fontWeight: 600, marginTop: 2 }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Projects */}
            <div style={{
                background: isDark ? 'var(--color-card-bg)' : '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 20, padding: '20px',
            }}>
                <div style={{
                    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--color-muted-text)', marginBottom: 14,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <TrendingUp size={13} /> Trending
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {trending.map((p, i) => (
                        <button
                            key={p.id}
                            onClick={() => onProjectClick(p)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 8px', borderRadius: 12,
                                background: 'none', border: 'none', cursor: 'pointer',
                                textAlign: 'left', transition: 'background 0.15s',
                                width: '100%',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <span style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                                           : i === 1 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                           : 'rgba(161,161,170,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 900, color: i < 2 ? '#fff' : 'var(--color-muted-text)',
                            }}>
                                {i + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '0.78rem', fontWeight: 700,
                                    color: 'var(--color-primary-text)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {p.title}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--color-muted-text)', marginTop: 2 }}>
                                    <Eye size={10} style={{ display: 'inline', marginRight: 3 }} />
                                    {fmtNum(p.views)} views
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Project() {
    const { isDark } = useTheme();
    const [search, setSearch]           = useState('');
    const [activeTags, setActiveTags]   = useState([]);
    const [sortBy, setSortBy]           = useState('newest');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const searchRef = useRef(null);

    // Keyboard shortcut: Cmd/Ctrl+K → focus search
    useEffect(() => {
        const handler = e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Toggle tag filter
    const toggleTag = tag => {
        setActiveTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    // Filtered + sorted projects
    const filtered = useMemo(() => {
        let list = PROJECTS_DATA;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q)) ||
                p.techStack.some(t => t.toLowerCase().includes(q))
            );
        }
        if (activeTags.length > 0) {
            list = list.filter(p => activeTags.every(t => p.tags.includes(t)));
        }
        switch (sortBy) {
            case 'popular': return [...list].sort((a, b) => (b.views + b.likes * 3) - (a.views + a.likes * 3));
            case 'views':   return [...list].sort((a, b) => b.views - a.views);
            case 'likes':   return [...list].sort((a, b) => b.likes - a.likes);
            default:        return list; // newest = original order
        }
    }, [search, activeTags, sortBy]);

    const accentGrad = 'linear-gradient(135deg,#6366f1,#8b5cf6)';

    return (
        <div style={{
            height: '100%', overflowY: 'auto', backgroundColor: 'var(--color-app-bg)',
            color: 'var(--color-primary-text)', fontFamily: 'Geist, Inter, sans-serif',
        }}>
            <style>{`
                @keyframes heroPulse {
                    0%,100% { opacity:0.55; transform:scale(1); }
                    50%     { opacity:0.75; transform:scale(1.06); }
                }
                @keyframes fadeSlideUp {
                    from { opacity:0; transform:translateY(16px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .proj-card-anim { animation: fadeSlideUp 0.35s ease-out both; }
                .search-focus:focus { outline:none; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
            `}</style>

            {/* ── Hero Section ──────────────────────────────────────────────── */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: '#09090f',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {/* Left edge glow — teal, exactly like the reference */}
                <div style={{
                    position: 'absolute', top: '50%', left: -150,
                    transform: 'translateY(-50%)',
                    width: 440, height: 440, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.55) 0%, transparent 65%)',
                    filter: 'blur(72px)', pointerEvents: 'none',
                    animation: 'heroPulse 7s ease-in-out infinite',
                }} />
                {/* Right edge glow — indigo */}
                <div style={{
                    position: 'absolute', top: '50%', right: -150,
                    transform: 'translateY(-50%)',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 65%)',
                    filter: 'blur(72px)', pointerEvents: 'none',
                    animation: 'heroPulse 9s ease-in-out 2s infinite',
                }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '48px 24px 44px' }}>
                    {/* Badge */}
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
                        <Sparkles size={10} style={{ color: '#06b6d4' }} />
                        Projects Portfolio
                    </div>

                    {/* Heading */}
                    <h1 style={{
                        margin: '0 0 12px',
                        fontSize: 'clamp(1.9rem, 5vw, 2.8rem)',
                        fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
                        color: '#ffffff',
                    }}>
                        My Projects &amp; Research
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        margin: '0 auto 26px',
                        fontSize: '0.93rem',
                        color: 'rgba(255,255,255,0.38)',
                        lineHeight: 1.7, maxWidth: 420,
                    }}>
                        Explore ML models, data pipelines & AI systems from beginner tutorials to production-grade deployments.
                    </p>

                    {/* Stat chips — key numbers at a glance */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { icon: <Layers size={13} />,  label: `${PROJECTS_DATA.length} Problems` },
                            { icon: <Filter size={13} />,  label: `${ALL_TAGS.filter(t => t !== 'Advanced').length} Topics` },
                            { icon: <Eye size={13} />,     label: `${fmtNum(PROJECTS_DATA.reduce((s,p)=>s+p.views,0))} Views` },
                            { icon: <Star size={13} />,    label: `${PROJECTS_DATA.filter(p=>p.featured).length} Featured` },
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

            {/* ── Filter Bar ───────────────────────────────────────────────── */}
            <div style={{
                borderBottom: `1px solid var(--color-border)`,
                background: isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50,
                padding: '12px 24px',
            }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 10,
                            background: showFilters
                                ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                                : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                            border: `1px solid ${showFilters ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                            color: showFilters ? '#818cf8' : 'var(--color-muted-text)',
                            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                        }}
                    >
                        <SlidersHorizontal size={13} />
                        Filters {activeTags.length > 0 && `(${activeTags.length})`}
                    </button>

                    {/* Tags scrollable */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        {ALL_TAGS.map(tag => (
                            <TagPill
                                key={tag}
                                tag={tag}
                                small
                                clickable
                                active={activeTags.includes(tag)}
                                onClick={() => toggleTag(tag)}
                            />
                        ))}
                    </div>

                    {/* Sort */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{
                                padding: '7px 32px 7px 12px',
                                borderRadius: 10, fontSize: '0.78rem', fontWeight: 600,
                                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-primary-text)',
                                cursor: 'pointer', appearance: 'none',
                            }}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} style={{
                            position: 'absolute', right: 10, top: '50%',
                            transform: 'translateY(-50%)', pointerEvents: 'none',
                            color: 'var(--color-muted-text)',
                        }} />
                    </div>
                </div>

                {/* Expanded filter panel */}
                {showFilters && (
                    <div style={{
                        maxWidth: 1280, margin: '10px auto 0',
                        padding: '12px 16px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: '1px solid var(--color-border)', borderRadius: 14,
                        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', marginRight: 4 }}>
                            Active filters:
                        </span>
                        {activeTags.length === 0 && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', fontStyle: 'italic' }}>None selected</span>
                        )}
                        {activeTags.map(tag => (
                            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <TagPill tag={tag} small active />
                                <button onClick={() => toggleTag(tag)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--color-muted-text)', padding: 0, lineHeight: 1,
                                }}>
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                        {activeTags.length > 0 && (
                            <button onClick={() => setActiveTags([])} style={{
                                marginLeft: 8, fontSize: '0.72rem', fontWeight: 700,
                                color: '#f87171', background: 'none', border: 'none', cursor: 'pointer',
                            }}>
                                Clear all
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div style={{
                maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) 280px',
                gap: 28,
            }}>
                {/* Left: projects grid */}
                <div>
                    {/* Actions Row: Count & Filters Reset */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {(search || activeTags.length > 0) && (
                                <button
                                    onClick={() => { setSearch(''); setActiveTags([]); }}
                                    style={{
                                        fontSize: '0.72rem', fontWeight: 700, color: '#ef4444',
                                        background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6,
                                        padding: '4px 10px', cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Animated Search Bar Row */}
                    <div style={{ marginBottom: 28, position: 'relative' }}>
                        <style>{`
                            @keyframes searchGradientTracer {
                                0% { background-position: 0% 50%; }
                                50% { background-position: 100% 50%; }
                                100% { background-position: 0% 50%; }
                            }
                        `}</style>
                        <div
                            style={{
                                padding: '2px', // border thickness
                                borderRadius: 16,
                                background: search ? 'linear-gradient(90deg, #6366f1, #06b6d4, #8b5cf6, #06b6d4, #6366f1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                                backgroundSize: '300% 300%',
                                animation: search ? 'searchGradientTracer 3s linear infinite' : 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: search ? '0 8px 32px -8px rgba(6,182,212,0.3)' : 'none',
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                display: 'flex', alignItems: 'center',
                                background: isDark ? 'var(--color-app-bg)' : '#ffffff',
                                borderRadius: 14,
                                padding: '12px 20px',
                            }}>
                                <Search size={18} style={{ color: search ? '#06b6d4' : 'var(--color-muted-text)', transition: 'color 0.3s', flexShrink: 0 }} />
                                <input
                                    ref={searchRef}
                                    className="search-focus"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search projects, tags, tech stack..."
                                    style={{
                                        flex: 1, padding: '0 16px', background: 'transparent',
                                        border: 'none', outline: 'none', color: 'var(--color-primary-text)',
                                        fontSize: '0.95rem', minWidth: 0,
                                    }}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        style={{
                                            marginLeft: 12, background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '50%',
                                            width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#ef4444', transition: 'all 0.2s', flexShrink: 0,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {filtered.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gridAutoRows: '1fr',
                            gap: 20,
                        }}>
                            {filtered.map((project, idx) => (
                                <div
                                    key={project.id}
                                    className="proj-card-anim"
                                    style={{ animationDelay: `${idx * 50}ms`, height: '100%' }}
                                >
                                    <ProjectCard
                                        project={project}
                                        isDark={isDark}
                                        onClick={() => setSelectedProject(project)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '80px 20px',
                            background: isDark ? 'var(--color-card-bg)' : '#ffffff',
                            border: '1px solid var(--color-border)',
                            borderRadius: 24,
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-text)' }}>
                                No projects found
                            </h3>
                            <p style={{ color: 'var(--color-muted-text)', margin: '0 0 20px', fontSize: '0.9rem' }}>
                                Try adjusting your search or filters
                            </p>
                            <button
                                onClick={() => { setSearch(''); setActiveTags([]); }}
                                style={{
                                    padding: '10px 24px', borderRadius: 12,
                                    background: accentGrad, color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                    fontWeight: 700, fontSize: '0.85rem',
                                }}
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: sidebar */}
                <aside>
                    <Sidebar
                        isDark={isDark}
                        projects={PROJECTS_DATA}
                        onProjectClick={setSelectedProject}
                    />
                </aside>
            </div>

            {/* ── Modal ────────────────────────────────────────────────────── */}
            {selectedProject && (
                <ProjectModal
                    project={selectedProject}
                    isDark={isDark}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
}
