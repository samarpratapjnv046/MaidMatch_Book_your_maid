import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useRealTime(onDataUpdate) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      // Join admin room for real-time updates
      socket.emit('join_admin');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for real-time data updates
    socket.on('data_update', (data) => {
      console.log('Real-time data update received:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate(data);
      }
    });

    socket.on('booking_created', (data) => {
      console.log('New booking created:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate({ type: 'booking', data });
      }
    });

    socket.on('booking_updated', (data) => {
      console.log('Booking updated:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate({ type: 'booking_update', data });
      }
    });

    socket.on('worker_registered', (data) => {
      console.log('New worker registered:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate({ type: 'worker', data });
      }
    });

    socket.on('user_registered', (data) => {
      console.log('New user registered:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate({ type: 'user', data });
      }
    });

    socket.on('payment_received', (data) => {
      console.log('Payment received:', data);
      setLastUpdate(new Date());
      if (onDataUpdate) {
        onDataUpdate({ type: 'payment', data });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [onDataUpdate]);

  const refreshData = useCallback(() => {
    // This function can be called to manually trigger a refresh
    // The actual refresh logic should be handled by the component using this hook
    setLastUpdate(new Date());
  }, []);

  return {
    isConnected,
    lastUpdate,
    refreshData,
    socket: socketRef.current
  };
}

export default useRealTime;
