/**
 * useStreaming hook
 * Provides streaming response handling with real-time updates
 */

import { useCallback, useRef, useEffect } from "react";
import { useChatStore } from "../app/store";

/**
 * Hook for streaming response handling
 */
export const useStreaming = () => {
  const chatState = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start streaming
   */
  const startStreaming = useCallback(() => {
    chatState.startStreaming();
    abortControllerRef.current = new AbortController();
  }, [chatState]);

  /**
   * Append chunk to current streaming content
   */
  const appendChunk = useCallback(
    (chunk: string) => {
      chatState.appendStreamingChunk(chunk);
    },
    [chatState],
  );

  /**
   * Complete streaming
   */
  const completeStreaming = useCallback(() => {
    chatState.finishStreaming();
    abortControllerRef.current = null;
  }, [chatState]);

  /**
   * Cancel streaming
   */
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    chatState.resetStreamingState();
    abortControllerRef.current = null;
  }, [chatState]);

  /**
   * Reset streaming state
   */
  const resetStreaming = useCallback(() => {
    chatState.resetStreamingState();
    abortControllerRef.current = null;
  }, [chatState]);

  /**
   * Get abort signal for fetch requests
   */
  const getAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    isStreaming: chatState.isStreamingResponse,
    streamingContent: chatState.currentStreamingChunk,

    // Actions
    startStreaming,
    appendChunk,
    completeStreaming,
    cancelStreaming,
    resetStreaming,
    getAbortSignal,
  };
};
