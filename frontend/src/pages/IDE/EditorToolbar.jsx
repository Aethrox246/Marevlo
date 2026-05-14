import React from 'react';
import { Play, RotateCcw, Code2, Copy, Check, Send } from 'lucide-react';

/**
 * EditorToolbar - Top toolbar with language indicator and action buttons
 */
const EditorToolbar = ({
    onRun,
    onSubmit,
    onReset,
    onCopy,
    isRunning,
    copied
}) => {
    return (
        <div className="h-14 border-b border-neutral-200 flex items-center justify-between px-5 bg-gradient-to-r from-neutral-50 to-white shrink-0">
            {/* Language Indicator */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-sm">
                    <Code2 size={14} className="text-neutral-700" />
                    <span className="text-xs font-semibold text-neutral-900">Python 3</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                    onClick={onCopy}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-all text-xs font-medium border border-neutral-200 shadow-sm hover:shadow"
                    aria-label="Copy code"
                >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>

                {/* Reset Button */}
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-all text-xs font-medium border border-neutral-200 shadow-sm hover:shadow"
                    aria-label="Reset code"
                >
                    <RotateCcw size={14} />
                    Reset
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-neutral-200 mx-1"></div>

                {/* Run Button */}
                <button
                    onClick={onRun}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                        ${isRunning
                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                            : 'bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm hover:shadow'
                        }`}
                    aria-label="Run code"
                >
                    <Play size={14} fill={isRunning ? "none" : "currentColor"} />
                    Run
                </button>

                {/* Submit Button */}
                <button
                    onClick={onSubmit}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                        ${isRunning
                            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-neutral-900 to-neutral-700 hover:from-neutral-800 hover:to-neutral-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                    aria-label="Submit solution"
                >
                    <Send size={14} />
                    Submit
                </button>
            </div>
        </div>
    );
};

export default EditorToolbar;
