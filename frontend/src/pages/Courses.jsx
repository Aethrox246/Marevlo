import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, GitBranch, Database, Cpu, Search, Play, Clock, Star, TrendingUp, MessageSquare, Users, Lightbulb } from 'lucide-react';

const COURSES = {
    "Generative AI": [
        {
            title: "LLM Fundamentals",
            description: "Understand the architecture behind GPT-4, Llama, and modern Transformers.",
            level: "Intermediate",
            duration: "12h",
            rating: 4.9,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Brain,
            iconColor: "text-black"
        },
        {
            title: "Building RAG Applications",
            description: "Learn to build context-aware AI agents using Vector Databases and LangChain.",
            level: "Advanced",
            duration: "18h",
            rating: 4.8,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Database,
            iconColor: "text-neutral-700"
        },
        {
            title: "Prompt Engineering Mastery",
            description: "The art of communicating with AI to get precise, deterministic outputs.",
            level: "Beginner",
            duration: "6h",
            rating: 4.7,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: MessageSquare,
            iconColor: "text-neutral-600"
        }
    ],
    "Data Structures & Algorithms (DSA)": [
        {
            title: "The Graph Theory Guide",
            description: "BFS, DFS, Dijkstra, and A* search. Master the nodes that connect the world.",
            level: "Intermediate",
            duration: "20h",
            rating: 4.9,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: GitBranch,
            iconColor: "text-black"
        },
        {
            title: "Dynamic Programming Patterns",
            description: "Break down complex problems into overlapping sub-problems. No more DP fear.",
            level: "Hard",
            duration: "25h",
            rating: 5.0,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Cpu,
            iconColor: "text-neutral-800"
        },
        {
            title: "Sorting & Searching Deep Dive",
            description: "Beyond Quicksort. Understand Hybrid Sorts, TimSort, and Binary Search variants.",
            level: "Beginner",
            duration: "10h",
            rating: 4.6,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Search,
            iconColor: "text-neutral-600"
        }
    ],
    "Recommendation AI": [
        {
            title: "Modern Recommender Systems",
            description: "Collaborative Filtering, Matrix Factorization, and Deep Learning for RecSys.",
            level: "Advanced",
            duration: "22h",
            rating: 4.9,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Star,
            iconColor: "text-black"
        },
        {
            title: "Two-Tower Architecture",
            description: "Build scalable retrieval and ranking models for millions of items.",
            level: "Expert",
            duration: "15h",
            rating: 4.8,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: TrendingUp,
            iconColor: "text-neutral-800"
        },
        {
            title: "Personalization Engines",
            description: "Real-time user profiling and session-based recommendations.",
            level: "Intermediate",
            duration: "14h",
            rating: 4.7,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Users,
            iconColor: "text-neutral-700"
        }
    ],
    "Prompt Engineering": [
        {
            title: "Prompt Engineering Mastery",
            description: "Master the art of crafting precise prompts to get deterministic, high-quality outputs from any LLM.",
            level: "Beginner",
            duration: "6h",
            rating: 4.8,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Lightbulb,
            iconColor: "text-amber-600"
        }
    ],
    "Video Processing": [
        {
            title: "Video Ingestion Pipeline",
            description: "Learn how to build end-to-end video ingestion systems, handle streams, and efficiently process deep learning workflows.",
            level: "Advanced",
            duration: "10h",
            rating: 4.9,
            imageColor: "from-neutral-100 to-neutral-200",
            icon: Play,
            iconColor: "text-indigo-600"
        }
    ]
};

export default function Courses() {
    const navigate = useNavigate();

    const handleCourseClick = (category, index) => {
        const courseId = `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}`;
        navigate(`/course/${courseId}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 h-full overflow-y-auto text-primary-text bg-app-bg scroll-smooth">
            <header className="mb-16 text-center">
                <h2 className="text-4xl font-bold text-primary-text mb-4">Structured Learning Paths</h2>
                <p className="text-muted-text text-lg max-w-2xl mx-auto">
                    Curated curriculums designed to take you from hello world to system architect.
                </p>
            </header>

            <div className="space-y-20">
                {Object.entries(COURSES).map(([category, courses]) => (
                    <section key={category}>
                        <div className="flex items-end gap-4 mb-8 border-b border-neutral-200 pb-4">
                            <h3 className="text-2xl font-bold text-primary-text tracking-tight">{category}</h3>
                            <span className="text-muted-text text-sm font-medium pb-1">{courses.length} Courses</span>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleCourseClick(category, i)}
                                    className="flex flex-col group bg-surface border border-neutral-200 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer">
                                    {/* Thumbnail Area */}
                                    <div className={`h - 48 bg - gradient - to - br ${course.imageColor} relative flex items - center justify - center overflow - hidden`}>
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
                                        <course.icon size={64} className={`${course.iconColor} opacity - 80 group - hover: scale - 110 transition - transform duration - 500 drop - shadow - lg`} />

                                        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-primary-text flex items-center gap-1 border border-neutral-200 shadow-sm">
                                            <Clock size={12} className="text-muted-text" /> {course.duration}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h4 className="text-xl font-bold text-primary-text mb-2 leading-tight group-hover:text-black transition-colors">
                                            {course.title}
                                        </h4>
                                        <p className="text-muted-text text-sm leading-relaxed mb-6 line-clamp-2">
                                            {course.description}
                                        </p>

                                        <div className="mt-auto">
                                            <button className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-sm font-bold text-primary-text transition-all flex items-center justify-center gap-2 group-hover:border-neutral-300 group-hover:bg-black group-hover:text-white">
                                                <Play size={16} fill="currentColor" /> Start Learning
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-20 text-center">
                <p className="text-muted-text">More modules coming soon...</p>
            </div>
        </div>
    );
}
