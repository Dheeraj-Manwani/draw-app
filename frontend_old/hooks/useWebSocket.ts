import { useEffect, useRef, useState, useCallback } from 'react';
import { type CollaborativeUser, type WebSocketMessage } from '@shared/schema';

interface UseWebSocketOptions {
  roomId: string;
  user: CollaborativeUser;
  onMessage?: (message: WebSocketMessage) => void;
  onUsersChange?: (users: CollaborativeUser[]) => void;
  onCursorMove?: (cursor: { x: number; y: number; userId: string }) => void;
}

export function useWebSocket({ roomId, user, onMessage, onUsersChange, onCursorMove }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState<CollaborativeUser[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Join room
      if (ws.current) {
        ws.current.send(JSON.stringify({
          type: 'user-join',
          roomId,
          data: { user }
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'room-users':
            setRoomUsers(message.data.users);
            onUsersChange?.(message.data.users);
            break;
          case 'user-join':
            setRoomUsers(prev => {
              const newUsers = [...prev.filter(u => u.id !== message.data.user.id), message.data.user];
              onUsersChange?.(newUsers);
              return newUsers;
            });
            break;
          case 'user-leave':
            setRoomUsers(prev => {
              const newUsers = prev.filter(u => u.id !== message.data.userId);
              onUsersChange?.(newUsers);
              return newUsers;
            });
            break;
          case 'cursor-move':
            onCursorMove?.(message.data.cursor);
            setRoomUsers(prev => prev.map(u => 
              u.id === message.data.cursor.userId 
                ? { ...u, cursor: message.data.cursor }
                : u
            ));
            break;
          default:
            onMessage?.(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [roomId, user, onMessage, onUsersChange, onCursorMove]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'roomId'>) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ...message,
        roomId
      }));
    }
  }, [roomId]);

  const sendCursorPosition = useCallback((x: number, y: number) => {
    sendMessage({
      type: 'cursor-move',
      data: { cursor: { x, y } }
    });
  }, [sendMessage]);

  return {
    isConnected,
    roomUsers,
    sendMessage,
    sendCursorPosition
  };
}
