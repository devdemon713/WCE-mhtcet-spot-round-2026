import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  // Guard against StrictMode double-mount creating two sockets
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      forceNew: false,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket.IO connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Socket.IO disconnected');
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
