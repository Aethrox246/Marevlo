import { useState, useEffect, useCallback, useRef } from 'react';

// Extract the domain to formulate the WS url
const HTTP_URL = import.meta.env.VITE_API_URL;
const WS_URL = HTTP_URL ? HTTP_URL.replace('http://', 'ws://').replace('https://', 'wss://') : 'ws://localhost:8000';

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(user) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempts = useRef(0);
    const isMounted = useRef(true);

    const connect = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token || !isMounted.current) return;

        // Don't create a new connection if one is already open or connecting
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        const ws = new WebSocket(`${WS_URL}/chat/ws?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMounted.current) { ws.close(); return; }
            console.log('WebSocket connected');
            reconnectAttempts.current = 0;
            setIsConnected(true);
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const customEvent = new CustomEvent('ws_message', { detail: data });
                window.dispatchEvent(customEvent);
            } catch (err) {
                console.error("Failed to parse websocket message", err);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            // Only clear ref if this is still the active socket
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
            // Reconnect with exponential backoff, only if still mounted and logged in
            if (isMounted.current &&
                localStorage.getItem('access_token') &&
                reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                const delay = RECONNECT_DELAY * Math.min(2 ** reconnectAttempts.current, 16);
                reconnectAttempts.current += 1;
                console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                reconnectTimeout.current = setTimeout(connect, delay);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            // Don't call ws.close() — the browser fires onclose automatically after onerror.
            // Calling close() manually causes double-close and double-reconnect scheduling.
        };
    }, []); // No dependencies — stable function identity

    useEffect(() => {
        isMounted.current = true;

        if (user) {
            connect();
        }

        return () => {
            isMounted.current = false;
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [user, connect]);

    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }, []);

    return { isConnected, sendMessage };
}
