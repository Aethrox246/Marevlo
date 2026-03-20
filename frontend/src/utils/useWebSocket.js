import { useState, useEffect, useCallback, useRef } from 'react';

// Extract the domain to formulate the WS url
const HTTP_URL = import.meta.env.VITE_API_URL;
const WS_URL = HTTP_URL ? HTTP_URL.replace('http://', 'ws://').replace('https://', 'wss://') : 'ws://localhost:8000';

export function useWebSocket(user) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeout = useRef(null);
    
    const connect = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;

        if (socket?.readyState === WebSocket.OPEN) return socket;

        const ws = new WebSocket(`${WS_URL}/chat/ws?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setSocket(ws);
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
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
            setSocket(null);
            // Attempt to reconnect after 3 seconds if user is still logged in
            if (localStorage.getItem('access_token')) {
                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        return ws;
    }, [socket]);

    useEffect(() => {
        let ws = null;
        if (user) {
            ws = connect();
        }

        return () => {
            if (ws) {
                ws.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [user, connect]);

    const sendMessage = useCallback((data) => {
        if (socket && isConnected) {
            socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        }
    }, [socket, isConnected]);

    return { isConnected, sendMessage };
}
