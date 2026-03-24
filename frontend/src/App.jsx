import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams, Outlet, Navigate } from 'react-router-dom';
import { Layers, Zap, Sun, Moon } from 'lucide-react';

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

import { loadAllTopics } from './utils/topicsLoader';

function Navigation() {
    const { user, userPoints, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'AU';
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-surface/95 backdrop-blur-xl transition-all duration-200" style={{ borderColor: 'var(--color-border)' }}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-black/5 pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div
                        className="p-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                        style={{
                            backgroundColor: isDark ? '#ffffff' : '#000000',
                            border: `1px solid ${isDark ? '#e5e5e5' : '#262626'}`
                        }}
                    >
                        <Layers size={20} style={{ color: isDark ? '#000000' : '#ffffff' }} />
                    </div>
                    <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-primary-text)' }}>
                        Marevlo
                    </span>
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

                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg hover:ring-2 transition-all"
                                    style={{
                                        backgroundColor: isDark ? '#ffffff' : '#000000',
                                        color: isDark ? '#000000' : '#ffffff'
                                    }}
                                >
                                    {getInitials(user.name)}
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
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
                                            <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">Sign Out</button>
                                        </div>
                                    </>
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
    );
}

function Layout() {
    return (
        <div className="h-screen flex flex-col font-sans transition-colors duration-200 overflow-auto" style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>
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
    const { addPoints } = useAuth();
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
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<HomeHandler />} />
                            <Route path="/login" element={<LoginWrapper />} />
                            <Route path="/signup" element={<SignupWrapper />} />
                            <Route path="/problems" element={<ProblemWrapper />} />
                            <Route path="/ide" element={<IDEWrapper />} />
                            <Route path="/ide/:id" element={<IDEWrapper />} />
                            <Route path="/feed" element={<FeedWrapper />} />
                            <Route path="/messages" element={<MessagesWrapper />} />
                            <Route path="/project" element={<Project />} />
                            <Route path="/courses" element={<Courses />} />
                            <Route path="/course/:id" element={<CourseContent />} />
                            <Route path="/jobs" element={<JobBoard />} />
                            <Route path="/plan" element={<Plan />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/about" element={<AboutUs />} />
                        </Route>
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
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
    const { login } = useAuth();
    const navigate = useNavigate();
    return <Signup onLogin={() => navigate('/login')} onSignupSuccess={(u) => { alert('Signup successful! Please log in.'); navigate('/login'); }} />;
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
