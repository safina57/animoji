import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSSEOptions {
  onOpen?: () => void;
  onError?: (error: string) => void;
  onMessage?: (data: any) => void;
}

export function useSSE(url: string | null, options: UseSSEOptions = {}) {
  // Use refs for callbacks to avoid re-triggering the connection effect
  const onOpenRef = useRef(options.onOpen);
  const onErrorRef = useRef(options.onError);
  const onMessageRef = useRef(options.onMessage);

  // Keep refs in sync with latest callbacks
  onOpenRef.current = options.onOpen;
  onErrorRef.current = options.onError;
  onMessageRef.current = options.onMessage;

  // Store latest received data
  const [data, setData] = useState<any>(null);

  // Store error state
  const [error, setError] = useState<string | null>(null);

  // Connection status
  const [isConnected, setIsConnected] = useState(false);

  // EventSource reference - persists across re-renders
  const eventSourceRef = useRef<EventSource | null>(null);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect/disconnect based on URL changes only
  useEffect(() => {
    if (!url) return;

    // Close existing connection if present
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url, {
        withCredentials: true}
    );
    eventSourceRef.current = eventSource;

    // Handle successful connection
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      onOpenRef.current?.();
    };

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
        onMessageRef.current?.(parsedData);
      } catch (parseError) {
        const errorMsg = 'Failed to parse event data';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      }
    };

    // Handle errors
    eventSource.onerror = () => {
      setIsConnected(false);

      // Only report as error if connection is completely closed
      if (eventSource.readyState === EventSource.CLOSED) {
        const errorMsg = 'Connection lost to event stream';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      }
    };

    // Cleanup on unmount or URL change
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [url]); // Only reconnect when URL changes

  return {
    data,
    error,
    isConnected,
    disconnect,
  };
}
