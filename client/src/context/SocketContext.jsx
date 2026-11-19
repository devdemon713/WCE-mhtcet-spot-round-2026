import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [clientsCount, setClientsCount] = useState(0);
  const socketRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Socket URL: use VITE_SOCKET_URL if set, otherwise fall back to VITE_API_URL.
    // This way if only VITE_API_URL is configured in Vercel dashboard, socket still works.
    const socketUrl = import.meta.env.VITE_SOCKET_URL
      || import.meta.env.VITE_API_URL
      || 'http://localhost:5000';

    const socketInstance = io(socketUrl, {
      // polling first → works through Render's proxy / Vercel edge
      // socket.io auto-upgrades to WebSocket after the handshake
      transports: ['polling', 'websocket'],
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket.IO connected:', socketInstance.id, '→', socketUrl);
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.warn('❌ Socket.IO disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connect error:', err.message);
    });

    socketInstance.on('clients-count', (count) => {
      setClientsCount(count);
    });

    setSocket(socketInstance);

    return () => {
      initialized.current = false;
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, clientsCount }}>
      {children}
    </SocketContext.Provider>
  );
}
