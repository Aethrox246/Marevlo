import React from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Building, Search, Filter } from 'lucide-react';
import Badge from '../components/Badge';
const JOBS = [];

export default function JobBoard() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 h-full overflow-y-auto text-primary-text">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-muted-text" size={20} />
                    <input
                        type="text"
                        placeholder="Search for roles, companies, or skills..."
                        className="w-full bg-white border border-neutral-200 rounded-xl py-3 pl-10 pr-4 text-primary-text focus:ring-1 focus:ring-black focus:border-black outline-none placeholder-muted-text"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-neutral-200 rounded-xl text-muted-text hover:text-primary-text hover:bg-neutral-50 transition-colors">
                    <Filter size={20} />
                    <span>Filters</span>
                </button>
            </div>

            <div className="space-y-4">
                {JOBS.length > 0 ? (
                    JOBS.map(job => (
                        <div key={job.id} className="bg-surface border border-neutral-200 p-6 rounded-xl hover:border-black/50 transition-all cursor-pointer group shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-neutral-50 flex items-center justify-center text-xl font-bold text-primary-text border border-neutral-200 group-hover:bg-black group-hover:text-white transition-colors">
                                        {job.logo}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-primary-text group-hover:text-black transition-colors">{job.role}</h3>
                                        <div className="flex items-center gap-2 text-muted-text text-sm">
                                            <Building size={14} />
                                            <span>{job.company}</span>
                                        </div>
                                    </div>
                                </div>
                                <Badge color={job.type === 'Full-time' ? 'bg-neutral-100 text-neutral-800' : 'bg-white border border-neutral-200 text-neutral-600'}>
                                    {job.type}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-text mb-4">
                                <div className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</div>
                                <div className="flex items-center gap-1.5"><DollarSign size={16} /> {job.salary}</div>
                                <div className="flex items-center gap-1.5"><Clock size={16} /> {job.posted}</div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {job.tags?.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-surface border border-neutral-200 rounded-xl">
                        <Briefcase size={48} className="mx-auto text-muted-text mb-4" />
                        <h3 className="text-xl font-bold text-primary-text mb-2">No Jobs Found</h3>
                        <p className="text-muted-text">Check back later for new opportunities.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
