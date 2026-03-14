import React, { useMemo } from 'react';
import { CheckCircle, Circle, ArrowRight, Lock, List } from 'lucide-react';
import problemsData from '../assets/graph_problems.json';

export default function ProblemList({ onSelect }) {
    // Process and group problems by difficulty
    const groupedProblems = useMemo(() => {
        const groups = {
            Easy: [],
            Medium: [],
            Hard: []
        };

        problemsData.forEach(p => {
            if (groups[p.difficulty]) {
                groups[p.difficulty].push({
                    ...p,
                    status: 'open', // Default status
                    acceptance: 'N/A'
                });
            }
        });

        // Convert to array for rendering
        return [
            {
                id: 'easy',
                level: "Easy Problems",
                desc: "Start here to build your fundamentals.",
                difficulty: "Easy",
                problems: groups.Easy
            },
            {
                id: 'medium',
                level: "Medium Problems",
                desc: "Challenge yourself with more complex patterns.",
                difficulty: "Medium",
                problems: groups.Medium
            },
            {
                id: 'hard',
                level: "Hard Problems",
                desc: "Master the most difficult algorithms.",
                difficulty: "Hard",
                problems: groups.Hard
            }
        ];
    }, []);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary-text mb-2">Practice Problems</h1>
                    <p className="text-muted-text">Total Problems: {problemsData.length}</p>
                </div>

                {groupedProblems.map((level) => (
                    <div key={level.id} className="bg-surface rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:border-neutral-300 transition-colors">
                        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-white border border-neutral-200 text-black`}>
                                    <List size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-primary-text shadow-sm">{level.level}</h2>
                            </div>
                            <p className="text-muted-text text-sm ml-11">{level.desc}</p>
                        </div>
                        {/* Show first 50 problems per category to avoid rendering issues */}
                        <div className="divide-y divide-neutral-100">
                            {level.problems.slice(0, 20).map((problem) => (
                                <button
                                    key={problem.id}
                                    onClick={() => onSelect(problem)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <Circle size={18} className="text-neutral-400 group-hover:text-black transition-colors" />
                                        <span className="font-medium text-primary-text group-hover:text-black font-bold">
                                            {problem.id}. {problem.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${problem.difficulty === 'Easy' ? 'bg-neutral-100 text-neutral-700 border border-neutral-200' :
                                            problem.difficulty === 'Medium' ? 'bg-neutral-200 text-neutral-800 border border-neutral-300' :
                                                'bg-black text-white'
                                            }`}>
                                            {problem.difficulty}
                                        </span>
                                        <ArrowRight size={16} className="text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ))}
                            {level.problems.length > 20 && (
                                <div className="p-4 text-center text-muted-text text-xs italic">
                                    And {level.problems.length - 20} more...
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
