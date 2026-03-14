import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userPoints, setUserPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage on mount
        const storedUser = localStorage.getItem('algosphere_user');
        const storedPoints = localStorage.getItem('algosphere_points');

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored user", error);
                localStorage.removeItem('algosphere_user');
            }
        }

        if (storedPoints) {
            setUserPoints(parseInt(storedPoints, 10));
        }

        setIsLoading(false);
    }, []);

    const login = (userData) => {
        const username = userData.username || (userData.email ? userData.email.split('@')[0] : 'user');
        const displayName = userData.name || userData.username || 'User';
        const userObj = {
            id: userData.id,
            name: displayName,
            email: userData.email,
            username,
            handle: '@' + username.toLowerCase().replace(/\s+/g, '')
        };

        setUser(userObj);
        localStorage.setItem('algosphere_user', JSON.stringify(userObj));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('algosphere_user');
    };

    const addPoints = (points = 50) => {
        setUserPoints(prev => {
            const newPoints = prev + points;
            localStorage.setItem('algosphere_points', newPoints.toString());
            return newPoints;
        });
    };

    const updateUser = (updates) => {
        setUser(prevUser => {
            const updatedUser = { ...prevUser, ...updates };
            localStorage.setItem('algosphere_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    return (
        <AuthContext.Provider value={{ user, userPoints, login, logout, addPoints, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
