import React from 'react';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * StatusNotification - Success/Error notification overlay (Dark Theme)
 */
const StatusNotification = ({
    status,
    attempts,
    onNext,
    onDismiss
}) => {
    if (status === 'success') {
        return (
            <div className="absolute top-20 right-8 z-50 animate-in fade-in slide-in-from-right-10">
                <div className="bg-neutral-800 border border-neutral-700 shadow-2xl rounded-xl p-6 w-80 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-emerald-500 text-white shrink-0 shadow-lg">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">Accepted! 🎉</h3>
                            <p className="text-neutral-400 text-sm mb-4">Your solution passed all test cases.</p>
                            <button
                                onClick={onNext}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl"
                            >
                                Next Problem <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error' && attempts === 1) {
        return (
            <div className="absolute top-20 right-8 z-50 animate-in fade-in slide-in-from-right-10 duration-300">
                <div className="bg-neutral-800 border border-neutral-700 shadow-2xl rounded-xl p-6 w-80 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                            <AlertCircle size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">Wrong Answer</h3>
                            <p className="text-neutral-400 text-sm mb-3">Your code didn't produce the expected output. Try again!</p>
                            <button
                                onClick={onDismiss}
                                className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error' && attempts > 1) {
        return (
            <div className="absolute top-20 right-8 z-50 animate-in fade-in slide-in-from-right-10 duration-300">
                <div className="bg-neutral-800 border border-neutral-700 shadow-2xl rounded-xl p-6 w-80 backdrop-blur-md">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                            <AlertCircle size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">Wrong Answer</h3>
                            <p className="text-neutral-400 text-sm mb-3">Still incorrect. Keep trying or skip to the next problem.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={onDismiss}
                                    className="flex-1 py-2 px-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold transition-all"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onNext}
                                    className="flex-1 py-2 px-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                                >
                                    Skip <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default StatusNotification;

