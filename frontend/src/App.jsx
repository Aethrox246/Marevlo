import React, { useState, useEffect, useRef, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Zap, Sun, Moon } from 'lucide-react';
import BugReportModal from './components/BugReportModal';
import NotificationBell from './components/NotificationBell';

import NavItem from './components/NavItem';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Lazy Load Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ProblemList = React.lazy(() => import('./pages/ProblemList'));
const IDE = React.lazy(() => import('./pages/IDE'));
const Feed = React.lazy(() => import('./pages/Feed'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Project = React.lazy(() => import('./pages/Project'));
const Courses = React.lazy(() => import('./pages/Courses'));
const CourseContent = React.lazy(() => import('./pages/CourseContent'));
const JobBoard = React.lazy(() => import('./pages/JobBoard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Plan = React.lazy(() => import('./pages/Plan'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const Research = React.lazy(() => import('./pages/Research'));
const ResearchPapers = React.lazy(() => import('./pages/ResearchPapers'));
const ResearchCourses = React.lazy(() => import('./pages/ResearchCourses'));
const ResearchCourseContent = React.lazy(() => import('./pages/ResearchCourseContent'));
const ResearchPaperContent = React.lazy(() => import('./pages/ResearchPaperContent'));
const T3TrackLanding = React.lazy(() => import('./pages/T3TrackLanding'));
const TopicProblems = React.lazy(() => import('./pages/TopicProblems'));

import { loadAllTopics } from './utils/topicsLoader';
import { MiraContextProvider, MiraWidget } from './components/mira';

function ProgressBar({ pct, color }) {
    const { isDark } = useTheme();
    return (
        <div style={{ height: '8px', borderRadius: '9999px', background: isDark ? '#262626' : '#f5f5f5', overflow: 'hidden' }}>
            <div style={{
                height: '100%', borderRadius: '9999px',
                width: `${Math.min(pct, 100)}%`,
                background: color,
                transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        </div>
    );
}

function LockedJobBoard({ problemsPct, problemsCompleted, problemsTotal, coursesPct, lessonsCompleted, lessonsTotal }) {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const surface = isDark ? '#1a1a1a' : '#ffffff';
    const border = isDark ? '#2a2a2a' : '#e5e5e5';
    const muted = isDark ? '#737373' : '#a3a3a3';
    const text = isDark ? '#f5f5f5' : '#171717';

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', background: 'var(--color-app-bg)' }}>
            <div style={{ maxWidth: '480px', width: '100%' }}>
                {/* Lock icon */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: isDark ? '#262626' : '#f5f5f5',
                        border: `1px solid ${border}`, marginBottom: '16px',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: text, margin: '0 0 8px' }}>Jobs Locked</h1>
                    <p style={{ fontSize: '14px', color: muted, margin: 0, lineHeight: 1.5 }}>
                        Complete <strong style={{ color: text }}>75% of problems</strong> and <strong style={{ color: text }}>75% of course lessons</strong> to unlock job opportunities.
                    </p>
                </div>

                {/* Progress cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {/* Problems */}
                    <div style={{ padding: '20px', borderRadius: '12px', background: surface, border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: text }}>Problems Solved</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: problemsPct >= 75 ? '#22c55e' : muted }}>
                                {problemsCompleted} / {problemsTotal} &nbsp;·&nbsp; {problemsPct}%
                            </span>
                        </div>
                        <ProgressBar pct={problemsPct} color={problemsPct >= 75 ? '#22c55e' : '#6366f1'} />
                        {problemsPct < 75 && (
                            <p style={{ fontSize: '12px', color: muted, margin: '8px 0 0' }}>
                                {Math.ceil((0.75 * problemsTotal) - problemsCompleted)} more problems to go
                            </p>
                        )}
                        {problemsPct >= 75 && (
                            <p style={{ fontSize: '12px', color: '#22c55e', margin: '8px 0 0', fontWeight: 600 }}>✓ Requirement met</p>
                        )}
                    </div>

                    {/* Courses */}
                    <div style={{ padding: '20px', borderRadius: '12px', background: surface, border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: text }}>Course Lessons</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: coursesPct >= 75 ? '#22c55e' : muted }}>
                                {lessonsCompleted} / {lessonsTotal} &nbsp;·&nbsp; {coursesPct}%
                            </span>
                        </div>
                        <ProgressBar pct={coursesPct} color={coursesPct >= 75 ? '#22c55e' : '#f59e0b'} />
                        {coursesPct < 75 && (
                            <p style={{ fontSize: '12px', color: muted, margin: '8px 0 0' }}>
                                {Math.ceil((0.75 * lessonsTotal) - lessonsCompleted)} more lessons to go
                            </p>
                        )}
                        {coursesPct >= 75 && (
                            <p style={{ fontSize: '12px', color: '#22c55e', margin: '8px 0 0', fontWeight: 600 }}>✓ Requirement met</p>
                        )}
                    </div>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/problems')}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                            border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', color: text,
                        }}
                    >
                        Go to Problems
                    </button>
                    <button
                        onClick={() => navigate('/courses')}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                            border: 'none', background: isDark ? '#ffffff' : '#000000',
                            color: isDark ? '#000000' : '#ffffff', cursor: 'pointer',
                        }}
                    >
                        Go to Courses
                    </button>
                </div>
            </div>
        </div>
    );
}

function JobBoardGuard({ children }) {
    const { user } = useAuth();
    const [status, setStatus] = useState(undefined); // undefined=loading, false=error, object=loaded

    useEffect(() => {
        if (!user) return;
        setStatus(undefined);
        const controller = new AbortController();
        const token = localStorage.getItem('access_token');
        fetch(`${import.meta.env.VITE_API_URL}/unlock/job-board`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setStatus(data))
            .catch((err) => { if (err.name !== 'AbortError') setStatus(false); });
        return () => controller.abort();
    }, [user]);

    if (!user) return children;
    if (status === undefined) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)', fontSize: '14px' }}>
            Checking access…
        </div>
    );
    if (status === false || status.unlocked) return children; // fail-open on error

    return (
        <LockedJobBoard
            problemsPct={status.problems.pct}
            problemsCompleted={status.problems.completed}
            problemsTotal={status.problems.total}
            coursesPct={status.courses.pct}
            lessonsCompleted={status.courses.lessons_completed}
            lessonsTotal={status.courses.lessons_total}
        />
    );
}

function Navigation() {
    const { user, userPoints, logout, profileData } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const profileMenuRef = useRef(null);

    // Close dropdown when clicking anywhere outside
    useEffect(() => {
        if (!showProfileMenu) return;
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'AU';
    };

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-surface/95 backdrop-blur-xl transition-all duration-200" style={{ borderColor: 'var(--color-border)' }}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-black/5 pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
                <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
                    <img src="/logo/logo marevlo.svg" alt="Marevlo" className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" />
                </div>

                {user ? (
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-6">
                            <NavItem label="Project" to="/project" />
                            <NavItem label="Jobs" to="/jobs" />
                            <NavItem label="Feed" to="/feed" />
                        </div>

                        <div className="flex items-center gap-4">
                            <NavItem label="Plan" to="/plan" />
                            <NavItem label="Courses" to="/courses" />
                            <NavItem label="Problems" to="/problems" />
                            <NavItem label="Research" to="/research" />
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center space-x-1"></div>
                )}

                <div className="flex items-center space-x-4">
                    {/* Dark Mode Toggle - Always Visible */}
                    <button
                        onClick={toggleTheme}
                        className="relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{
                            backgroundColor: isDark ? '#262626' : '#f5f5f5',
                            border: `1px solid ${isDark ? '#404040' : '#e5e5e5'}`
                        }}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <div className="relative w-5 h-5">
                            <Sun
                                size={20}
                                className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 text-yellow-400' : 'opacity-0 rotate-90 text-yellow-500'}`}
                            />
                            <Moon
                                size={20}
                                className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 text-slate-400' : 'opacity-100 rotate-0 text-slate-700'}`}
                            />
                        </div>
                    </button>

                    {user ? (
                        <>
                            <div
                                className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-sm"
                                title="Level 3 · Top 5%"
                                style={{
                                    backgroundColor: isDark ? '#262626' : '#f5f5f5',
                                    border: `1px solid ${isDark ? '#404040' : '#e5e5e5'}`,
                                    color: 'var(--color-primary-text)'
                                }}
                            >
                                <Zap size={14} fill="currentColor" />
                                <span className="font-mono font-bold text-xs">{userPoints} XP</span>
                            </div>

                            <NotificationBell />

                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={() => setShowProfileMenu(prev => !prev)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg hover:ring-2 transition-all overflow-hidden"
                                    style={{
                                        backgroundColor: isDark ? '#ffffff' : '#000000',
                                        color: isDark ? '#000000' : '#ffffff'
                                    }}
                                >
                                    {profileData?.avatar_url
                                        ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                                        : getInitials(user.name)
                                    }
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileMenu && (
                                    <div
                                        className="absolute right-0 top-12 w-48 rounded-xl shadow-2xl py-2 z-50"
                                        style={{
                                            backgroundColor: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                            <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-primary-text)' }}>{user.name}</p>
                                                <p className="text-xs truncate" style={{ color: 'var(--color-muted-text)' }}>{user.handle || user.email}</p>
                                            </div>
                                            <div
                                                onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                                                className="w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors"
                                                style={{ color: 'var(--color-muted-text)' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--color-muted-text)';
                                                }}
                                            >Profile</div>
                                            <div
                                                className="w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors"
                                                style={{ color: 'var(--color-muted-text)' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--color-muted-text)';
                                                }}
                                            >Settings</div>
                                            <div
                                                onClick={() => { navigate('/about'); setShowProfileMenu(false); }}
                                                className="w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors"
                                                style={{ color: 'var(--color-muted-text)' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--color-muted-text)';
                                                }}
                                            >About Us</div>
                                            <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }}></div>
                                            <div
                                                onClick={() => { setShowBugReport(true); setShowProfileMenu(false); }}
                                                className="w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors"
                                                style={{ color: 'var(--color-muted-text)' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = 'var(--color-muted-text)';
                                                }}
                                            >Report a Bug</div>
                                            <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }}></div>
                                            <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={{ color: 'var(--color-muted-text)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--color-primary-text)';
                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--color-muted-text)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: isDark ? '#ffffff' : '#000000',
                                    color: isDark ? '#000000' : '#ffffff'
                                }}
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
        {showBugReport && (
            <BugReportModal isDark={isDark} onClose={() => setShowBugReport(false)} />
        )}
        </>
    );
}

function Layout() {
    return (
        <div className="h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden" style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>
            <Navigation />
            <div className="h-[68px] shrink-0"></div> {/* Spacer matching exact nav height */}
            <main className="flex-1 overflow-auto h-[calc(100vh-68px)]">
                <Suspense fallback={<div className="flex items-center justify-center h-full w-full">Loading...</div>}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}

function ProblemWrapper() {
    const navigate = useNavigate();
    return <ProblemList onSelect={(p) => navigate(`/ide/${p.id}`)} />
}

function IDEWrapper() {
    const { addPoints } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [problem, setProblem] = React.useState(null);
    const [allProblems, setAllProblems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadAllTopics().then(topics => {
            const flat = topics.flatMap(t => t.problems);
            setAllProblems(flat);
            const found = flat.find(p => String(p.id) === id);
            setProblem(found ? found._raw : null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const handleNext = () => {
        const currentIndex = allProblems.findIndex(p => String(p.id) === id);
        const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1
            ? allProblems[currentIndex + 1]
            : null;
        if (nextProblem) {
            navigate(`/ide/${nextProblem.id}`);
        } else {
            navigate('/problems');
        }
    };

    // Build judgeTestCases from examples in the raw problem
    const judgeTestCases = React.useMemo(() => {
        if (!problem?.examples) return [];
        return problem.examples
            .filter(ex => ex.output)
            .map(ex => ({
                input: ex.input || '',
                expected_output: ex.output,
            }));
    }, [problem]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)' }}>Loading problem...</div>;
    }

    return <IDE
        problem={problem}
        judgeTestCases={judgeTestCases}
        onBack={() => navigate('/problems')}
        onSolved={() => addPoints(50)}
        onNext={handleNext}
    />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <MiraContextProvider>
                    <Router>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/" element={<HomeHandler />} />
                                <Route path="/login" element={<LoginWrapper />} />
                                <Route path="/signup" element={<SignupWrapper />} />
                                <Route path="/problems" element={<ProblemWrapper />} />
                                <Route path="/problems/:topicId" element={<TopicProblems />} />
                                <Route path="/ide" element={<IDEWrapper />} />
                                <Route path="/ide/:id" element={<IDEWrapper />} />
                                <Route path="/feed" element={<FeedWrapper />} />
                                <Route path="/messages" element={<MessagesWrapper />} />
                                <Route path="/project" element={<Project />} />
                                <Route path="/courses" element={<Courses />} />
                                <Route path="/course/:id" element={<CourseContent />} />
                                <Route path="/jobs" element={<JobBoardGuard><JobBoard /></JobBoardGuard>} />
                                <Route path="/plan" element={<Plan />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/about" element={<AboutUs />} />
                                <Route path="/research" element={<Research />} />
                                <Route path="/research/papers" element={<ResearchPapers />} />
                                <Route path="/research/paper/:slug" element={<ResearchPaperContent />} />
                                <Route path="/research/courses" element={<ResearchCourses />} />
                                <Route path="/research/track/recommender-system" element={<T3TrackLanding />} />
                                <Route path="/research/course/:id" element={<ResearchCourseContent />} />
                            </Route>
                        </Routes>
                        <MiraRouteGate />
                    </Router>
                </MiraContextProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

function MiraRouteGate() {
    const { pathname } = useLocation();

    if (pathname === '/' || pathname === '/feed' || pathname === '/messages') {
        return null;
    }

    return <MiraWidget />;
}

// Helper components to bridge the gap between old props and new Router/Context
function HomeHandler() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return <LandingPage
        onStart={() => user ? navigate('/problems') : navigate('/signup')}
        onExplore={() => user ? navigate('/feed') : navigate('/signup')}
    />;
}

function LoginWrapper() {
    const { login } = useAuth();
    const navigate = useNavigate();
    return <Login onLogin={(u) => { login(u); navigate('/feed'); }} onSignup={() => navigate('/signup')} />;
}

function SignupWrapper() {
    const navigate = useNavigate();
    return <Signup onLogin={() => navigate('/login')} onSignupSuccess={() => { alert('Signup successful! Please log in.'); navigate('/login'); }} />;
}

function FeedWrapper() {
    const { user } = useAuth();
    const navigate = useNavigate();
    // Feed expected 'user' and 'setView'.
    return <Feed user={user} setView={(view) => navigate('/' + view)} />;
}

function MessagesWrapper() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return <Messages user={user} setView={(view) => navigate('/' + view)} />;
}
