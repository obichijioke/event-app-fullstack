import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/notification-store';
import { Notification } from '../types/organizer';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export function useNotificationsSocket(accessToken: string | null, enabled: boolean = true) {
  const socketRef = useRef<Socket | null>(null);
  const { addNotification, setConnected } = useNotificationStore();

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    // Initialize socket connection
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to notifications');
      setConnected(true);
    });

    socket.on('connected', (data) => {
      console.log('[WebSocket] Connection confirmed:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      setConnected(false);
    });

    // Notification event handlers
    socket.on('notification:new', (notification: Notification) => {
      console.log('[WebSocket] New notification received:', notification);
      console.log('[WebSocket] Current unread count before:', useNotificationStore.getState().unreadCount);

      // Add to store
      addNotification(notification);

      console.log('[WebSocket] Current unread count after:', useNotificationStore.getState().unreadCount);

      // Show toast notification
      showNotificationToast(notification);
    });

    socket.on('notification:updated', (notification: Notification) => {
      console.log('[WebSocket] Notification updated:', notification);
      // Handle notification updates if needed
    });

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up socket connection');
      socket.off('connect');
      socket.off('connected');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notification:new');
      socket.off('notification:updated');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, enabled, addNotification, setConnected]);

  // Return connection status instead of socket ref to avoid render-time ref access
  return {
    isConnected: useNotificationStore((state) => state.isConnected),
  };
}

function showNotificationToast(notification: Notification) {
  const { type, title, message } = notification;
  const displayMessage = `${title}\n${message}`;

  switch (type) {
    case 'success':
      toast.success(displayMessage, { duration: 5000 });
      break;
    case 'error':
      toast.error(displayMessage, { duration: 7000 });
      break;
    case 'warning':
      toast(displayMessage, { icon: '⚠️', duration: 6000 });
      break;
    default:
      toast(displayMessage, { duration: 5000 });
  }
}
