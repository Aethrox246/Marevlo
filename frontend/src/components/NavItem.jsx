import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function NavItem({ icon: Icon, label, to }) {
    const { isDark } = useTheme();
    
    return (
        <NavLink
            to={to}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm hover:scale-105"
            style={({ isActive }) => ({
                backgroundColor: isActive ? (isDark ? '#ffffff' : '#000000') : 'transparent',
                color: isActive ? (isDark ? '#000000' : '#ffffff') : 'var(--color-muted-text)',
                boxShadow: isActive ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
            })}
        >
            {Icon && <Icon size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />}
            <span className="relative z-10 tracking-wide">{label}</span>
        </NavLink>
    );
}
