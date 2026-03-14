import React from 'react';
import { UserPlus, Search, Briefcase } from 'lucide-react';

const PEOPLE = [];

export default function Network() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 h-full overflow-y-auto text-primary-text">
            <h2 className="text-2xl font-bold text-primary-text mb-6">Your Network</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PEOPLE.length > 0 ? (
                    PEOPLE.map(person => (
                        <div key={person.id} className="bg-surface border border-neutral-200 p-6 rounded-xl flex flex-col items-center text-center hover:border-neutral-300 transition-colors shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-neutral-100 mb-4 flex items-center justify-center text-2xl font-bold text-primary-text border-2 border-neutral-200">
                                {person.avatar}
                            </div>
                            <h3 className="font-bold text-primary-text mb-1">{person.name}</h3>
                            <p className="text-sm text-neutral-600 mb-1">{person.role}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-text mb-4">
                                <Briefcase size={12} />
                                <span>{person.company}</span>
                            </div>
                            <div className="text-xs text-muted-text mb-4">{person.mutual} mutual connections</div>
                            <button className="w-full py-2 bg-neutral-100 hover:bg-black text-black hover:text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2">
                                <UserPlus size={16} /> Connect
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-surface border border-neutral-200 rounded-xl">
                        <UserPlus size={48} className="mx-auto text-muted-text mb-4" />
                        <h3 className="text-xl font-bold text-primary-text mb-2">No Connections Yet</h3>
                        <p className="text-muted-text">Expand your network by finding fellow developers.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
