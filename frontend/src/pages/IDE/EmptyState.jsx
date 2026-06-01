import React from 'react';
import { Code2 } from 'lucide-react';

/**
 * EmptyState - Displayed when no problem is selected (Dark Theme)
 */
const EmptyState = () => {
    return (
        <div className="h-full flex items-center justify-center bg-neutral-950">
            <div className="text-center">
                <div className="mb-4 inline-flex p-4 rounded-full bg-neutral-800 shadow-lg">
                    <Code2 size={48} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground/70 text-lg font-medium">No problem selected</p>
                <p className="text-muted-foreground text-sm mt-2">Select a problem to start coding</p>
            </div>
        </div>
    );
};

export default EmptyState;

