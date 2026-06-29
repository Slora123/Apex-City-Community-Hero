import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');

let sharedSocket = null;

/**
 * Returns a singleton socket.io connection.
 * Multiple components can call this hook — they all share one socket.
 */
export function useSocket(handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    // Create the shared socket once
    if (!sharedSocket) {
      sharedSocket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });
    }

    const socket = sharedSocket;

    // Register all handlers passed in
    const registered = [];
    for (const [event, handler] of Object.entries(handlersRef.current)) {
      const wrapped = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrapped);
      registered.push([event, wrapped]);
    }

    return () => {
      // Clean up only this component's handlers
      for (const [event, wrapped] of registered) {
        socket.off(event, wrapped);
      }
    };
  }, []); // only once — handlers are accessed via ref so they stay fresh
}

export function getSocket() {
  return sharedSocket;
}
