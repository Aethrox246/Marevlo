import React from 'react';

export default function Badge({ children, color = "bg-slate-700" }) {
    return (
        <span className={`${color} text-xs px-2 py-0.5 rounded text-white font-medium`}>
            {children}
        </span>
    );
}
