import React from 'react';

export default function Badge({ children, color = "bg-slate-700" }) {
    // Note: 'color' prop might pass old utility classes. Ideally, we should audit usages too.
    // For now, let's assume 'color' prop overrides are okay, but if it defaults, we use a neutral surface color.
    // Actually, bg-slate-700 is a bit light for a default badge? Let's use bg-surface with a border maybe?
    // Or just keep it as is if it's passed dynamically.
    // The prompt asks to implement the palette.
    return (
        <span className={`${color} text-xs px-2 py-0.5 rounded text-white font-medium`}>
            {children}
        </span>
    );
}
