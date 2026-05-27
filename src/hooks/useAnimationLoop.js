import { useEffect, useRef, useState, useCallback } from 'react';

export const useAnimationLoop = (callback) => {
  const [isRunning, setIsRunning] = useState(false);
  const requestRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback reference updated without triggering re-effects
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loopRef = useRef();

  const loop = useCallback((time) => {
    if (callbackRef.current) {
      callbackRef.current(time);
    }
    requestRef.current = requestAnimationFrame(loopRef.current);
  }, []);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const start = useCallback(() => {
    if (requestRef.current === null) {
      setIsRunning(true);
      requestRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  const stop = useCallback(() => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return { start, stop, isRunning };
};
