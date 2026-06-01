import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
    return (
        <div className="h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden bg-background text-foreground">
            <Navigation />
            <div className="h-[68px] shrink-0" />
            <main className="flex-1 overflow-auto h-[calc(100vh-68px)]">
                <ErrorBoundary>
                    <Suspense fallback={<div className="flex items-center justify-center h-full w-full text-muted-foreground" style={{ fontSize: '14px' }}>Loading…</div>}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
        </div>
    );
}
