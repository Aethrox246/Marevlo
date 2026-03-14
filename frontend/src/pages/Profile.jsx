import React, { useState, useRef, useEffect } from 'react';
import { Layers, Trophy, Zap, CheckCircle, Camera, FileText, Edit2, Save, X, Link as LinkIcon, MapPin, Briefcase } from 'lucide-react';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user, updateUser } = useAuth();

    // Default values fallback
    const defaults = {
        name: 'User',
        headline: 'Aspiring Developer',
        bio: '',
        location: '',
        email: 'user@example.com',
        avatar: null,
        resumeName: null,
        github: '',
        linkedin: ''
    };

    const displayProfile = { ...defaults, ...user };


    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(displayProfile);

    const fileInputRef = useRef(null);
    const resumeInputRef = useRef(null);

    // Update editForm when user data changes
    useEffect(() => {
        if (!isEditing) {
            setEditForm(displayProfile);
        }
    }, [user, isEditing]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // Reduced to 2MB for localStorage safety
            alert('File size exceeds 2MB limit.');
            return;
        }
        e
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setEditForm(prev => ({ ...prev, avatar: base64String }));

            // If not in edit mode, update via context
            if (!isEditing) {
                updateUser({ avatar: base64String });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleResumeUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!isEditing) {
                updateUser({ resumeName: file.name });
            } else {
                setEditForm(prev => ({ ...prev, resumeName: file.name }));
            }
            alert(`Resume "${file.name}" uploaded successfully!`);
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            setEditForm(displayProfile);
        } else {
            setEditForm(displayProfile);
        }
        setIsEditing(!isEditing);
    };

    const saveProfile = () => {
        updateUser(editForm);
        setIsEditing(false);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 h-full overflow-y-auto custom-scrollbar text-primary-text">

            {/* PROFILE HEADER CARD */}
            <div className="bg-surface border border-neutral-200 rounded-2xl p-8 shadow-sm mb-6 relative overflow-hidden">
                {/* Background Banner */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-neutral-100 to-neutral-200"></div>

                <div className="relative pt-16 flex flex-col md:flex-row items-start md:items-end gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-black flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {editForm.avatar ? (
                                <img src={editForm.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span>{displayProfile.name[0]?.toUpperCase() || 'U'}</span>
                            )}

                            {/* Hover Overlay for Upload */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0 pb-2">
                        {isEditing ? (
                            <div className="space-y-3 max-w-md">
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full text-3xl font-bold bg-white border border-neutral-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Name"
                                />
                                <input
                                    type="text"
                                    value={editForm.headline}
                                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                                    className="w-full text-base text-muted-text bg-white border border-neutral-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Headline"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="text-sm bg-white border border-neutral-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-black outline-none"
                                        placeholder="Location"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl font-bold text-primary-text mb-1">{displayProfile.name}</h1>
                                <p className="text-lg text-muted-text mb-3">{displayProfile.headline}</p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
                                    {displayProfile.location && (
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {displayProfile.location}</span>
                                    )}
                                    <span className="flex items-center gap-1"><Briefcase size={14} /> Available</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 self-start md:self-end mb-2">
                        {isEditing ? (
                            <>
                                <button onClick={toggleEdit} className="px-4 py-2 rounded-lg font-medium text-muted-text hover:bg-neutral-100 transition-colors">Cancel</button>
                                <button onClick={saveProfile} className="px-6 py-2 rounded-lg font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2">
                                    <Save size={16} /> Save
                                </button>
                            </>
                        ) : (
                            <button onClick={toggleEdit} className="px-4 py-2 rounded-lg font-bold border border-neutral-300 hover:bg-neutral-50 transition-colors flex items-center gap-2">
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ABOUT SECTION */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">About</h3>
                        {isEditing ? (
                            <textarea
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                className="w-full min-h-[120px] p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-black outline-none text-sm leading-relaxed"
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <p className="text-muted-text leading-relaxed whitespace-pre-wrap">
                                {displayProfile.bio || "No bio added yet."}
                            </p>
                        )}
                    </div>

                    {/* ACTIVITY / ACHIEVEMENTS */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Trophy size={18} className="text-black" /> Recent Achievements
                        </h3>

                        <div className="space-y-6">
                            {/* Empty State for Achievements */}
                            <div className="text-center py-8 opacity-50">
                                <Trophy size={32} className="mx-auto mb-2 text-muted-text" />
                                <p className="text-sm text-muted-text">No recent achievements yet.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* STATS CARD */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-sm text-primary-text mb-4 uppercase tracking-wider opacity-70">Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                                <span className="text-sm text-muted-text">Global Rank</span>
                                <span className="font-mono font-bold">Unranked</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                                <span className="text-sm text-muted-text">Streak</span>
                                <span className="font-mono font-bold flex items-center gap-1">0 <Zap size={12} className="fill-black" /></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-text">Reputation</span>
                                <span className="font-mono font-bold">0</span>
                            </div>
                        </div>
                    </div>

                    {/* RESUME SECTION */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-sm text-primary-text mb-4 uppercase tracking-wider opacity-70 flex items-center gap-2">
                            <FileText size={16} /> Resume
                        </h3>

                        {displayProfile.resumeName ? (
                            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 mb-3 flex items-center justify-between group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={16} className="text-neutral-500 flex-shrink-0" />
                                    <span className="text-sm font-medium truncate">{displayProfile.resumeName}</span>
                                </div>
                                <button className="text-neutral-400 hover:text-red-500 transition-colors" onClick={() => updateUser({ resumeName: null })}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl hover:border-black/20 transition-colors mb-3">
                                <p className="text-xs text-muted-text mb-2">No resume uploaded</p>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={resumeInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                        />

                        <button
                            onClick={() => resumeInputRef.current?.click()}
                            className="w-full py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors shadow-md"
                        >
                            {displayProfile.resumeName ? 'Update Resume' : 'Upload Resume'}
                        </button>
                    </div>

                    {/* SOCIALS / LINKS */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-sm text-primary-text mb-4 uppercase tracking-wider opacity-70 flex items-center gap-2">
                            <LinkIcon size={16} /> Links
                        </h3>
                        <div className="space-y-3">
                            {isEditing ? (
                                <>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editForm.github || ''}
                                            onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                                            placeholder="GitHub URL"
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-black outline-none text-sm"
                                        />
                                        <span className="absolute left-3 top-2.5 w-2 h-2 rounded-full bg-neutral-600"></span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editForm.linkedin || ''}
                                            onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                                            placeholder="LinkedIn URL"
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-black outline-none text-sm"
                                        />
                                        <span className="absolute left-3 top-2.5 w-2 h-2 rounded-full bg-blue-500"></span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {displayProfile.github ? (
                                        <a href={displayProfile.github} target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-neutral-50 text-muted-text hover:text-primary-text transition-colors flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-neutral-800"></span> GitHub
                                        </a>
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-text/50 italic">GitHub not added</div>
                                    )}

                                    {displayProfile.linkedin ? (
                                        <a href={displayProfile.linkedin} target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-neutral-50 text-muted-text hover:text-primary-text transition-colors flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> LinkedIn
                                        </a>
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-text/50 italic">LinkedIn not added</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
