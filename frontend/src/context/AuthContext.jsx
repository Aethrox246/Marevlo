import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../utils/useWebSocket';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profileStats, setProfileStats] = useState({ xp: 0, level: 1, streak: 0, rank: null, courses_completed: 0, problems_solved: 0 });
    const [achievements, setAchievements] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derived: userPoints alias for backwards compat
    const userPoints = profileStats.xp;

    useWebSocket(user);

    const logout = () => {
        setUser(null);
        setProfileStats({ xp: 0, level: 1, streak: 0, rank: null, courses_completed: 0, problems_solved: 0 });
        setAchievements([]);
        setProfileData(null);
        localStorage.removeItem('marevlo_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    /** Make an authenticated API call */
    const apiCall = useCallback(async (path, options = {}) => {
        let token = localStorage.getItem('access_token');
        const makeRequest = async (t) => {
            const headers = {
                'Content-Type': 'application/json',
                ...(t ? { Authorization: `Bearer ${t}` } : {}),
                ...options.headers,
            };
            return fetch(`${API_BASE}${path}`, { ...options, headers });
        };

        let resp = await makeRequest(token);
        // Token expired - try to refresh once, then retry
        if (resp.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const r = await fetch(`${API_BASE}/auth/refresh`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${refreshToken}` },
                    });
                    if (r.ok) {
                        const data = await r.json();
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
                        token = data.access_token;
                        resp = await makeRequest(token);
                    } else {
                        logout();
                        throw new Error('Session expired. Please login again.');
                    }
                } catch {
                    logout();
                    throw new Error('Session expired. Please login again.');
                }
            } else {
                logout();
                throw new Error('Session expired. Please login again.');
            }
        }

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${resp.status}`);
        }
        return resp.json();
    }, [logout]);

    /** Refresh profile stats + achievements from backend */
    const refreshStats = useCallback(async () => {
        try {
            const [stats, achiev, prof] = await Promise.all([
                apiCall('/profile/stats'),
                apiCall('/profile/achievements'),
                apiCall('/profile/me'),
            ]);
            setProfileStats(stats);
            setAchievements(achiev);
            setProfileData(prof);
            // Keep user.xp in sync for XP bar
            setUser(prev => prev ? { ...prev, xp: stats.xp } : prev);
        } catch (e) {
            // Not logged in or token expired - ignore silently
            console.warn('Profile stats fetch failed:', e.message);
        }
    }, [apiCall]);

    useEffect(() => {
        const storedUser = localStorage.getItem('marevlo_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('marevlo_user');
            }
        }
        setIsLoading(false);
    }, []);

    // Fetch stats whenever user logs in
    useEffect(() => {
        if (user?.id) {
            refreshStats();
        }
    }, [user?.id, refreshStats]);

    // Background refresh to keep access token alive
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) return;
            try {
                const r = await fetch(`${API_BASE}/auth/refresh`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });
                if (r.ok) {
                    const data = await r.json();
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                } else {
                    logout();
                }
            } catch {
                // Network error - try again next interval
            }
        }, 13 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, logout]);

    const login = (userData) => {
        const username = userData.username || (userData.email ? userData.email.split('@')[0] : 'user');
        const displayName = userData.name || userData.username || 'User';
        const userObj = {
            id: userData.id,
            name: displayName,
            email: userData.email,
            username,
            handle: '@' + username.toLowerCase().replace(/\s+/g, ''),
        };
        setUser(userObj);
        localStorage.setItem('marevlo_user', JSON.stringify(userObj));
    };

    const addPoints = (points = 50) => {
        setProfileStats(prev => ({ ...prev, xp: prev.xp + points }));
    };

    /** Update profile fields locally AND persist to backend */
    const updateUser = async (updates) => {
        // Local state update
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('marevlo_user', JSON.stringify(updated));
            return updated;
        });

        // Persist to backend (bio, location, headline, github_url, linkedin_url, skills, name)
        const profileFields = ['bio', 'location', 'headline', 'github_url', 'linkedin_url', 'skills', 'name'];
        const profileUpdates = {};
        profileFields.forEach(f => {
            if (updates[f] !== undefined) profileUpdates[f] = updates[f];
        });

        if (Object.keys(profileUpdates).length > 0) {
            try {
                const updated = await apiCall('/profile/me', {
                    method: 'PUT',
                    body: JSON.stringify(profileUpdates),
                });
                setProfileData(updated);
            } catch (e) {
                console.warn('Profile update failed:', e.message);
            }
        }
    };

    /** Upload resume file to backend, returns resume_url */
    const uploadResume = async (file) => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch(`${API_BASE}/profile/resume`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!resp.ok) throw new Error('Resume upload failed');
        const data = await resp.json();
        setProfileData(prev => prev ? { ...prev, resume_url: data.resume_url } : prev);
        return data;
    };

    return (
        <AuthContext.Provider value={{
            user, userPoints, profileStats, achievements, profileData,
            login, logout, addPoints, updateUser, uploadResume, refreshStats, apiCall, isLoading,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
