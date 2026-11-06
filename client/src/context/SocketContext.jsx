import { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8082';
    const websocketUrl = socketUrl.replace(/^http/, 'ws') + '/ws/websocket';
    const listeners = new Map();
    const topics = [
      'seat-update',
      'seats-reset',
      'round-update',
      'announcement-update',
      'admin-alert',
      'break-start',
      'break-end',
      'allocation-update',
      'allocation-batch-complete'
    ];

    const socketInstance = {
      on(event, handler) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(handler);
      },
      off(event, handler) {
        if (!listeners.has(event)) return;
        if (handler) listeners.get(event).delete(handler);
        else listeners.delete(event);
      }
    };

    const stompClient = new Client({
      brokerURL: websocketUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        topics.forEach((topic) => {
          stompClient.subscribe(`/topic/${topic}`, (message) => {
            const data = JSON.parse(message.body);
            listeners.get(topic)?.forEach((handler) => handler(data));
          });
        });
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false)
    });

    stompClient.activate();
    setSocket(socketInstance);

    return () => {
      setConnected(false);
      stompClient.deactivate();
      listeners.clear();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, clientsCount: 0 }}>
      {children}
    </SocketContext.Provider>
  );
}
