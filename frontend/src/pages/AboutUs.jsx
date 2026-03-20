import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Layers, Code2, Users, Zap, BookOpen, Target } from 'lucide-react';

const values = [
    {
        icon: Code2,
        title: 'Code First',
        description: 'We believe the best way to learn programming is by writing real code — solving real problems.',
    },
    {
        icon: Users,
        title: 'Community Driven',
        description: 'Learning is social. Marevlo connects developers to collaborate, discuss, and grow together.',
    },
    {
        icon: Zap,
        title: 'Gamified Learning',
        description: 'XP, badges, and leaderboards turn skill-building into an engaging, rewarding journey.',
    },
    {
        icon: BookOpen,
        title: 'Structured Curriculum',
        description: 'From beginner to advanced, our curated paths guide you through every concept step by step.',
    },
    {
        icon: Target,
        title: 'Career Ready',
        description: 'Interview prep, job boards, and project showcases — we prepare you for the real world.',
    },
];

export default function AboutUs() {
    const { isDark } = useTheme();

    return (
        <div
            className="min-h-full w-full"
            style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}
        >
            {/* Hero Section */}
            <div
                className="relative overflow-hidden py-24 px-6 text-center"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f0f9ff 100%)',
                }}
            >
                {/* Background blobs */}
                <div
                    className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
                    style={{ backgroundColor: isDark ? '#3b82f6' : '#6366f1' }}
                />
                <div
                    className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: isDark ? '#8b5cf6' : '#3b82f6' }}
                />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div
                        className="inline-flex items-center justify-center p-4 rounded-2xl shadow-2xl mb-6"
                        style={{
                            backgroundColor: isDark ? '#ffffff' : '#000000',
                        }}
                    >
                        <Layers size={36} style={{ color: isDark ? '#000000' : '#ffffff' }} />
                    </div>
                    <h1
                        className="text-5xl font-extrabold tracking-tight mb-4"
                        style={{ color: 'var(--color-primary-text)' }}
                    >
                        About <span style={{ color: isDark ? '#818cf8' : '#4f46e5' }}>Marevlo</span>
                    </h1>
                    <p
                        className="text-xl leading-relaxed max-w-2xl mx-auto"
                        style={{ color: 'var(--color-muted-text)' }}
                    >
                        Marevlo is a modern coding &amp; learning platform built for developers who want to grow faster — through challenges, courses, and community.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div
                    className="rounded-3xl p-10 text-center shadow-lg"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-primary-text)' }}>
                        Our Mission
                    </h2>
                    <p className="text-lg leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>
                        We believe every developer deserves access to world-class learning resources, a supportive community, and the tools to land their dream job. Marevlo brings all of that together into one seamless platform — making the journey from beginner to professional both exciting and achievable.
                    </p>
                </div>

                {/* Values Grid */}
                <h2 className="text-3xl font-bold mt-16 mb-8 text-center" style={{ color: 'var(--color-primary-text)' }}>
                    What We Stand For
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {values.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                style={{
                                    backgroundColor: isDark ? '#1e1e2e' : '#ede9fe',
                                    color: isDark ? '#818cf8' : '#4f46e5',
                                }}
                            >
                                <Icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-primary-text)' }}>
                                {title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>
                                {description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <div className="mt-16 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-muted-text)' }}>
                        Built with ❤️ by the Marevlo team · {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
