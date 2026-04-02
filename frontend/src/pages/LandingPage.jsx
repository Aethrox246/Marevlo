import React from 'react';
import { ChevronRight, Layers, Users, Briefcase, Code, Terminal, Globe, ArrowUpRight, CheckCircle2, Zap, MessageSquare } from 'lucide-react';

export default function LandingPage({ onStart, onExplore }) {
    return (
        <div className="overflow-y-auto h-full text-primary-text scroll-smooth bg-app-bg">
            {/*  Background Blobs - Monochrome */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-neutral-300/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-neutral-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-neutral-100/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-32 px-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>

                        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tighter text-black">
                            Master Code. <br />
                            <span className="underline decoration-4 underline-offset-8 decoration-neutral-200">
                                Grow Together.
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-600 mb-10 max-w-xl leading-relaxed font-medium">
                            The first platform that blends rigorous <strong className="text-black font-semibold">technical training</strong> with a professional <strong className="text-black font-semibold">developer network</strong>. Solve problems, share insights, and get hired.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={onStart} className="px-8 py-4 bg-black text-white rounded-lg font-medium text-lg hover:bg-neutral-800 transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Start Coding <ChevronRight className="ml-2 w-5 h-5" />
                            </button>
                            <button onClick={onExplore} className="px-8 py-4 bg-white text-black border-2 border-black rounded-lg font-bold text-lg hover:bg-neutral-50 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                Explore Community
                            </button>
                        </div>


                    </div>

                    {/* Hero Graphic: IDE + Feed Hybrid */}
                    <div className="relative hidden lg:block perspective">
                        {/* Abstract Visual Connection */}
                        <div className="absolute inset-0 bg-neutral-200/50 rounded-3xl -rotate-6 scale-95 blur-2xl"></div>

                        <div className="relative bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl skew-y-1 hover:skew-y-0 transition-all duration-700">
                            {/* Fake IDE Header - macOS style grayscale */}
                            <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                                </div>
                                <div className="font-mono text-xs text-neutral-400 font-medium">solution.py</div>
                            </div>

                            {/* Code Snippet - Colored Syntax */}
                            <div className="font-mono text-sm text-neutral-800 mb-6 space-y-1.5 leading-relaxed">
                                <p><span className="font-bold text-purple-600">def</span> <span className="font-bold text-blue-600">solve_ladder</span>(problem):</p>
                                <p className="pl-4"><span className="text-neutral-400 italic"># Step 1: Analyze complexity</span></p>
                                <p className="pl-4">complexity = problem.difficulty</p>
                                <p className="pl-4 mb-2"></p>
                                <p className="pl-4"><span className="font-bold text-purple-600">if</span> complexity &gt; <span className="text-amber-600">"Hard"</span>:</p>
                                <p className="pl-8"><span className="font-bold text-purple-600">return</span> <span className="text-amber-600">"Ask Community"</span></p>
                            </div>

                            <div className="absolute -bottom-10 -right-10 bg-white p-5 rounded-lg border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-72 animate-float">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-200">U</div>
                                    <div>
                                        <p className="text-sm font-bold text-primary-text">User</p>
                                        <p className="text-xs text-muted-text">Just solved this!</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 border border-neutral-100">
                                    "The hash map intuition for this problem was tricky, but I finally got it. Here's my approach..."
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button className="flex-1 py-1.5 bg-neutral-100 text-black text-xs rounded hover:bg-neutral-200 transition-colors font-medium">View Solution</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/*"Why Marevlo?" */}
            <section className="py-24 relative overflow-hidden bg-white/50">
                {/* Section Specific Background */}
                <div className="absolute inset-0 bg-white/50 skew-y-3 transform origin-bottom-left -z-10 border-y border-neutral-200 backdrop-blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-primary-text mb-4">The Marevlo Ecosystem</h2>
                        <p className="text-muted-text max-w-2xl mx-auto text-lg">We've reimagined the coding interview prep experience. It's not just about solving problems; it's about evolving your mindset.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Card 1: Adaptive Ladders */}
                        <div className="flex flex-col p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg hover:border-neutral-400 hover:shadow-xl transition-all duration-300 group">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold text-primary-text mb-4">Adaptive Ladders</h3>
                                <p className="text-muted-text leading-relaxed text-lg">
                                    Stuck on 'Hard'? Our L1/L2 breakdown system simplifies complex problems into manageable micro-concepts.
                                </p>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Layers size={16} className="text-neutral-600 group-hover:text-white" /> Dynamic Diff
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <CheckCircle2 size={16} className="text-neutral-600 group-hover:text-white" /> Sub-problems
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <ArrowUpRight size={16} className="text-neutral-600 group-hover:text-white" /> Step-by-step
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Zap size={16} className="text-neutral-600 group-hover:text-white" /> Instant Feedback
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Collaborative Core */}
                        <div className="flex flex-col p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg hover:border-neutral-400 hover:shadow-xl transition-all duration-300 group">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold text-primary-text mb-4">Collaborative Core</h3>
                                <p className="text-muted-text leading-relaxed text-lg">
                                    Coding is better together. See real-time activity, debug with peers, and share your "Aha!" moments.
                                </p>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Users size={16} className="text-neutral-600 group-hover:text-white" /> Live Feed
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <MessageSquare size={16} className="text-neutral-600 group-hover:text-white" /> Peer Debug
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Code size={16} className="text-neutral-600 group-hover:text-white" /> Code Reviews
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Globe size={16} className="text-neutral-600 group-hover:text-white" /> Community
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Career Launchpad */}
                        <div className="flex flex-col p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg hover:border-neutral-400 hover:shadow-xl transition-all duration-300 group">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold text-primary-text mb-4">Career Launchpad</h3>
                                <p className="text-muted-text leading-relaxed text-lg">
                                    Your profile is more than just stats. It's a living resume showcasing your problem-solving velocity.
                                </p>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Briefcase size={16} className="text-neutral-600 group-hover:text-white" /> Skill Badges
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <Users size={16} className="text-neutral-600 group-hover:text-white" /> Recruiters
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <CheckCircle2 size={16} className="text-neutral-600 group-hover:text-white" /> Verified Stats
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-sm font-medium text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors">
                                    <ArrowUpRight size={16} className="text-neutral-600 group-hover:text-white" /> Resume Export
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* HOW IT WORKS */}
            <section className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-primary-text mb-6">Your Path to Mastery</h2>
                        <p className="text-muted-text text-lg max-w-2xl mx-auto">
                            A structured workflow designed to take you from novice to expert through consistent practice and feedback.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-100 -translate-y-1/2 hidden md:block z-0"></div>

                        <div className="grid md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { step: "01", title: "Set Goals", desc: "Define your target role and skill gaps." },
                                { step: "02", title: "Practice", desc: "Solve adaptive problems daily." },
                                { step: "03", title: "Collaborate", desc: "Review code with peers." },
                                { step: "04", title: "Succeed", desc: "Track progress and get verified." }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg md:shadow-none hover:shadow-xl transition-all duration-300 text-center group">
                                    <div className="w-12 h-12 mx-auto bg-black text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-primary-text mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-text leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>



            {/* "Start Building" Footer Banner */}
            <section className="py-20 bg-black text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <p className="text-neutral-400 font-medium mb-6 text-sm md:text-base tracking-wide uppercase">
                        No credit card required to start coding.
                    </p>
                    <button onClick={onStart} className="group relative inline-flex items-center justify-center px-12 py-6 bg-white text-black text-2xl md:text-3xl font-bold rounded-full hover:scale-105 transition-transform duration-300 shadow-2xl hover:shadow-white/20">
                        <span>Start building for free</span>
                        <ArrowUpRight className="ml-4 w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </section>
        </div>
    );
}
