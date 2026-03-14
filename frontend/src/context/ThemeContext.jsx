import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('marevlo-theme');
            return saved === 'dark';
        }
        return false;
    });

    // Use useLayoutEffect for instant theme application (no flash)
    useLayoutEffect(() => {
        const root = document.documentElement;
        
        if (isDark) {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
        
        localStorage.setItem('marevlo-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Apply theme immediately on page load (before React hydrates)
    useEffect(() => {
        const saved = localStorage.getItem('algosphere-theme');
        if (saved === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    const value = {
        isDark,
        toggleTheme,
        setDark: () => setIsDark(true),
        setLight: () => setIsDark(false),
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
