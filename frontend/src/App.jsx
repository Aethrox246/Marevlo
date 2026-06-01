import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MiraContextProvider, MiraWidget } from './components/mira';
import { ToastProvider, useToast } from './components/Toast';

import Layout from './components/Layout';
import JobBoardGuard from './components/JobBoardGuard';

import { loadAllTopics } from './utils/topicsLoader';

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

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
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
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

function MiraRouteGate() {
    const { pathname } = useLocation();
    if (pathname === '/' || pathname === '/feed' || pathname === '/messages') return null;
    return <MiraWidget />;
}

function HomeHandler() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return <LandingPage onStart={() => navigate(user ? '/problems' : '/signup')} onExplore={() => navigate(user ? '/feed' : '/signup')} />;
}

function LoginWrapper() {
    const { login } = useAuth();
    const navigate = useNavigate();
    return <Login onLogin={(u) => { login(u); navigate('/feed'); }} onSignup={() => navigate('/signup')} />;
}

function SignupWrapper() {
    const navigate = useNavigate();
    const showToast = useToast();
    return <Signup onLogin={() => navigate('/login')} onSignupSuccess={() => { showToast('Account created! Please sign in.', 'success'); navigate('/login'); }} />;
}

function ProblemWrapper() {
    const navigate = useNavigate();
    return <ProblemList onSelect={(p) => navigate(`/ide/${p.id}`)} />;
}

function FeedWrapper() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return <Feed user={user} setView={(view) => navigate('/' + view)} />;
}

function MessagesWrapper() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return <Messages user={user} setView={(view) => navigate('/' + view)} />;
}

function IDEWrapper() {
    const { addPoints } = useAuth();
    const navigate = useNavigate();
    const { id, topicId } = useParams();
    const [problem, setProblem] = React.useState(null);
    const [allProblems, setAllProblems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadAllTopics().then(topics => {
            const flat = topicId
                ? (topics.find(t => t.id === topicId)?.problems || [])
                : topics.flatMap(t => t.problems);
            setAllProblems(flat);
            const found = flat.find(p => String(p.id) === id);
            setProblem(found ? { ...found._raw, _vizFile: found._vizFile, _topicKey: found._topicKey } : null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id, topicId]);

    const handleNext = () => {
        const currentIndex = allProblems.findIndex(p => String(p.id) === id);
        const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1
            ? allProblems[currentIndex + 1]
            : null;
        if (nextProblem) {
            navigate(topicId ? `/problems/${topicId}/${nextProblem.id}` : `/ide/${nextProblem.id}`);
        } else {
            navigate(topicId ? `/problems/${topicId}` : '/problems');
        }
    };

    const judgeTestCases = React.useMemo(() => {
        if (!problem?.examples) return [];
        return problem.examples
            .filter(ex => ex.output)
            .map(ex => ({ input: ex.input || '', expected_output: ex.output }));
    }, [problem]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)' }}>Loading problem…</div>;
    }

    return <IDE
        problem={problem}
        judgeTestCases={judgeTestCases}
        onBack={() => navigate(topicId ? `/problems/${topicId}` : '/problems')}
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
                                <Route path="/problems/:topicId/:id" element={<IDEWrapper />} />
                                <Route path="/ide" element={<IDEWrapper />} />
                                <Route path="/ide/:id" element={<IDEWrapper />} />
                                <Route path="/feed" element={<FeedWrapper />} />
                                <Route path="/messages" element={<MessagesWrapper />} />
                                <Route path="/project" element={<Project />} />
                                <Route path="/courses/*" element={<Courses />} />
                                <Route path="/course/:id" element={<CourseContent />} />
                                <Route path="/jobs" element={<JobBoardGuard><JobBoard /></JobBoardGuard>} />
                                <Route path="/plan" element={<Plan />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/about" element={<AboutUs />} />
                                <Route path="/research" element={<Research />} />
                                <Route path="/research/papers" element={<ResearchPapers />} />
                                <Route path="/research/paper/:slug" element={<ResearchPaperContent />} />
                                <Route path="/research/courses/*" element={<ResearchCourses />} />
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
