import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, Eye, Heart, Clock, ExternalLink, Github, Download, X,
    Zap, Star, TrendingUp, ChevronDown, Filter, BookOpen, Layers,
    Cpu, BarChart2, MessageSquare, Globe, SlidersHorizontal, Award,
    ArrowUpRight, Code2, Database, Brain, Sparkles, FileText, Target,
    CheckCircle, FlaskConical, GraduationCap, ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ProjectDetail from './ProjectDetail';

// Project Data
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

// Tag + Category Config
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

// Tag Colour Map
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

// Stat Formatter
function fmtNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

// Tag Pill
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

// Category accent colours (no images needed)
const CATEGORY_ACCENTS = {
    'NLP':                  'from-cyan-500 to-indigo-500',
    'Graph Neural Networks':'from-emerald-500 to-teal-400',
    'Deep Learning':        'from-violet-500 to-purple-400',
    'Computer Vision':      'from-blue-500 to-cyan-400',
    'Document AI':          'from-orange-500 to-amber-400',
};
function getCategoryAccent(cat) {
    return CATEGORY_ACCENTS[cat] || 'from-indigo-500 to-cyan-500';
}

// Project Card — no thumbnail, editorial style
function ProjectCard({ project, isDark, onClick }) {
    const [liked, setLiked] = useState(false);
    const accent = getCategoryAccent(project.category);
    return (
        <div
            onClick={onClick}
            className={[
                'group relative flex flex-col h-full overflow-hidden rounded-2xl cursor-pointer',
                'transition-all duration-300 ease-out',
                'hover:-translate-y-1.5',
                isDark
                    ? 'bg-[#1b1b21] border border-white/[0.07] hover:border-indigo-500/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.15)]'
                    : 'bg-white border border-black/[0.07] hover:border-indigo-400/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_0_1px_rgba(99,102,241,0.1)]',
            ].join(' ')}
        >
            {/* Gradient accent bar — replaces thumbnail */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${accent} group-hover:h-2 transition-all duration-300`} />

            {/* Featured pill */}
            {project.featured && (
                <span className="absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-widest text-white bg-gradient-to-r from-amber-500 to-red-500 shadow-lg shadow-amber-500/30">
                    ⭐ Featured
                </span>
            )}

            {/* Body */}
            <div className="flex flex-col flex-1 gap-3 p-5">
                {/* Category */}
                <span className={`self-start px-2.5 py-0.5 rounded-md text-[0.62rem] font-bold uppercase tracking-widest bg-gradient-to-r ${accent} bg-clip-text text-transparent border border-white/10`}>
                    {project.category}
                </span>

                <h3 className={`text-[0.95rem] font-extrabold leading-snug tracking-tight ${isDark ? 'text-[#e4e1ea]' : 'text-gray-900'}`}>
                    {project.title}
                </h3>

                <p className={`text-[0.8rem] leading-relaxed line-clamp-2 ${isDark ? 'text-[#c7c4d7]' : 'text-gray-500'}`}>
                    {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {project.tags.slice(0, 3).map(t => <TagPill key={t} tag={t} small />)}
                </div>

                {/* Stats */}
                <div className={`flex items-center justify-between mt-auto pt-3 text-[0.73rem] border-t ${isDark ? 'border-white/[0.07] text-[#c7c4d7]' : 'border-black/[0.06] text-gray-400'}`}>
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1.5"><Eye size={12}/>{fmtNum(project.views)}</span>
                        <button
                            onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
                            className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-red-400 font-bold' : ''}`}
                        >
                            <Heart size={12} fill={liked ? '#f87171' : 'none'}/>
                            {fmtNum(project.likes + (liked ? 1 : 0))}
                        </button>
                    </div>
                    <span className="flex items-center gap-1"><Clock size={11}/>{project.lastUpdated}</span>
                </div>
            </div>

            {/* Hover CTA */}
            <div className="px-5 pb-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                <div className={`w-full text-center py-2.5 rounded-xl text-[0.8rem] font-bold text-white tracking-wide bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30`}>
                    View Project <ArrowUpRight size={13} className="inline ml-1"/>
                </div>
            </div>
        </div>
    );
}

// ProjectModal replaced by full-screen ProjectDetail (see ProjectDetail.jsx)

// Sidebar
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

// Main Component
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

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[#09090f] border-b border-white/[0.06]">
                {/* Teal glow left */}
                <div className="absolute top-1/2 -left-36 -translate-y-1/2 w-[440px] h-[440px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(6,182,212,0.55) 0%,transparent 65%)',filter:'blur(72px)',animation:'heroPulse 7s ease-in-out infinite'}} />
                {/* Indigo glow right */}
                <div className="absolute top-1/2 -right-36 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(99,102,241,0.5) 0%,transparent 65%)',filter:'blur(72px)',animation:'heroPulse 9s ease-in-out 2s infinite'}} />

                <div className="relative z-10 text-center px-6 py-14">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50 border border-white/10 bg-white/[0.055] backdrop-blur-lg">
                        <Sparkles size={10} className="text-cyan-400" />
                        Projects Portfolio
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white mb-3">
                        My Projects &amp; Research
                    </h1>

                    <p className="text-[0.93rem] text-white/40 leading-relaxed max-w-md mx-auto mb-7">
                        Explore ML models, data pipelines &amp; AI systems from beginner tutorials to production-grade deployments.
                    </p>

                    {/* Stat chips */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {[
                            { icon: <Layers size={13}/>, label: `${PROJECTS_DATA.length} Problems` },
                            { icon: <Filter size={13}/>, label: `${ALL_TAGS.filter(t=>t!=='Advanced').length} Topics` },
                            { icon: <Eye size={13}/>, label: `${fmtNum(PROJECTS_DATA.reduce((s,p)=>s+p.views,0))} Views` },
                            { icon: <Star size={13}/>, label: `${PROJECTS_DATA.filter(p=>p.featured).length} Featured` },
                        ].map(({ icon, label }) => (
                            <div key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.76rem] font-semibold text-white/60 border border-white/[0.09] bg-white/[0.055] backdrop-blur-lg">
                                <span className="text-white/35">{icon}</span>{label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={`border-b sticky top-0 z-50 px-6 py-3 backdrop-blur-xl ${
                isDark ? 'bg-[#09090f]/80 border-white/[0.07]' : 'bg-white/90 border-black/[0.06]'
            }`}>
                <div className="max-w-screen-xl mx-auto flex items-center gap-2.5 flex-wrap">
                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[0.78rem] font-bold transition-all ${
                            showFilters
                                ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-400'
                                : isDark
                                    ? 'bg-white/[0.07] border border-white/[0.08] text-white/50 hover:bg-white/10'
                                    : 'bg-black/[0.05] border border-black/[0.07] text-gray-500 hover:bg-black/[0.08]'
                        }`}
                    >
                        <SlidersHorizontal size={13} />
                        Filters {activeTags.length > 0 && `(${activeTags.length})`}
                    </button>

                    {/* Tags */}
                    <div className="flex gap-1.5 flex-wrap flex-1">
                        {ALL_TAGS.map(tag => (
                            <TagPill key={tag} tag={tag} small clickable active={activeTags.includes(tag)} onClick={() => toggleTag(tag)} />
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className={`pr-8 pl-3 py-1.5 rounded-xl text-[0.78rem] font-semibold appearance-none cursor-pointer ${
                                isDark ? 'bg-white/[0.07] border border-white/[0.08] text-white/80' : 'bg-black/[0.05] border border-black/[0.07] text-gray-700'
                            }`}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                    </div>
                </div>

                {/* Active filters panel */}
                {showFilters && (
                    <div className={`max-w-screen-xl mx-auto mt-2.5 px-4 py-3 rounded-2xl flex flex-wrap gap-2 items-center ${
                        isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-black/[0.03] border border-black/[0.05]'
                    }`}>
                        <span className={`text-[0.72rem] font-bold mr-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Active filters:</span>
                        {activeTags.length === 0 && <span className={`text-[0.78rem] italic ${isDark ? 'text-white/30' : 'text-gray-400'}`}>None selected</span>}
                        {activeTags.map(tag => (
                            <div key={tag} className="flex items-center gap-1">
                                <TagPill tag={tag} small active />
                                <button onClick={() => toggleTag(tag)} className={`p-0.5 rounded-full ${isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}><X size={11}/></button>
                            </div>
                        ))}
                        {activeTags.length > 0 && (
                            <button onClick={() => setActiveTags([])} className="ml-2 text-[0.72rem] font-bold text-red-400 hover:text-red-300 transition-colors">Clear all</button>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="max-w-screen-xl mx-auto px-6 py-8 pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-7">
                {/* Left: projects grid */}
                <div>
                    {/* Reset row */}
                    {(search || activeTags.length > 0) && (
                        <div className="flex items-center mb-4">
                            <button
                                onClick={() => { setSearch(''); setActiveTags([]); }}
                                className="text-[0.72rem] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mb-7 relative">
                        <div className={`p-[2px] rounded-2xl transition-all duration-300 ${
                            search
                                ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500 bg-[length:300%] animate-[searchGradient_3s_linear_infinite] shadow-[0_8px_32px_-8px_rgba(6,182,212,0.3)]'
                                : isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
                        }`}>
                            <div className={`flex items-center rounded-[14px] px-5 py-3 ${
                                isDark ? 'bg-[#0e0e14]' : 'bg-white'
                            }`}>
                                <Search size={18} className={`flex-shrink-0 transition-colors duration-300 ${search ? 'text-cyan-400' : isDark ? 'text-white/30' : 'text-gray-400'}`}/>
                                <input
                                    ref={searchRef}
                                    className={`flex-1 px-4 bg-transparent border-none outline-none text-[0.95rem] search-focus ${
                                        isDark ? 'text-[#e4e1ea] placeholder:text-white/25' : 'text-gray-900 placeholder:text-gray-400'
                                    }`}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search projects, tags, tech stack..."
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="ml-3 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all hover:scale-110">
                                        <X size={12}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" style={{ gridAutoRows: '1fr' }}>
                            {filtered.map((project, idx) => (
                                <div key={project.id} className="proj-card-anim h-full" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <ProjectCard project={project} isDark={isDark} onClick={() => setSelectedProject(project)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-20 rounded-3xl border ${
                            isDark ? 'bg-[#1b1b21] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                        }`}>
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className={`text-lg font-extrabold mb-2 ${ isDark ? 'text-[#e4e1ea]' : 'text-gray-900'}`}>No projects found</h3>
                            <p className={`text-[0.9rem] mb-5 ${ isDark ? 'text-white/40' : 'text-gray-500'}`}>Try adjusting your search or filters</p>
                            <button
                                onClick={() => { setSearch(''); setActiveTags([]); }}
                                className="px-6 py-2.5 rounded-xl font-bold text-[0.85rem] text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
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

            {/* Modal */}
            {selectedProject && (
                <ProjectDetail
                    project={selectedProject}
                    isDark={isDark}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </div>
    );
}
