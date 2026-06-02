import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NavItem({ label, to, onNavigate }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Match nested routes too: "/research" stays active on "/research/papers".
    // "/" only matches exactly so the logo route doesn't light up everywhere.
    const isActive = to === '/'
        ? location.pathname === '/'
        : location.pathname === to || location.pathname.startsWith(to + '/');

    const handleClick = () => {
        navigate(to);
        onNavigate?.();
    };

    return (
        <button
            onClick={handleClick}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative px-4 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
            {label}
            {isActive && (
                <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
            )}
        </button>
    );
}
