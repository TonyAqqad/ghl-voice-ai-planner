import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  lastMessage: any | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoConnect = true
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const messageQueue = useRef<any[]>([]);
  
  // Store callbacks in refs to prevent re-renders
  const callbacksRef = useRef({
    onMessage,
    onOpen,
    onClose,
    onError
  });
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setState({ isConnected: true, isConnecting: false, error: null, lastMessage: null });
        
        // Send queued messages
        while (messageQueue.current.length > 0) {
          const message = messageQueue.current.shift();
          ws.send(JSON.stringify(message));
        }

        callbacksRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          callbacksRef.current.onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: new Error('WebSocket connection error') }));
        callbacksRef.current.onError?.(error);
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
        callbacksRef.current.onClose?.();

        // Reconnect logic
        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => connect(), reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Failed to reconnect to WebSocket');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setState({ isConnected: false, isConnecting: false, error: error as Error, lastMessage: null });
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    wsRef.current?.close();
    messageQueue.current = [];
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      // Queue message for when connection is established
      messageQueue.current.push(data);
      // Check connection state without depending on state
      if (wsRef.current?.readyState !== WebSocket.CONNECTING && wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    }
  }, [connect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      shouldReconnect.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      messageQueue.current = [];
    };
  }, [autoConnect, url]);

  return {
    ...state,
    connect,
    disconnect,
    send
  };
}

