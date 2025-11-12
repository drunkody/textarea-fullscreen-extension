/**
 * Generic MutationObserver hook with debouncing and filtering
 * Watches for DOM changes and triggers callback
 */

import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

interface UseMutationObserverOptions {
 /** Debounce delay in milliseconds */
 debounce?: number;
 /** MutationObserver configuration */
 config?: MutationObserverInit;
 /** Custom filter function to reduce unnecessary callbacks */
 filter?: (mutations: MutationRecord[]) => boolean;
}

/**
 * Hook to observe DOM mutations with debouncing
 * @param callback - Function to execute when mutations match filter
 * @param options - Configuration for observer behavior
 */
export function useMutationObserver(
 callback: () => void,
 options: UseMutationObserverOptions = {}
) {
 const {
 debounce = 150,
 config = { childList: true, subtree: true },
 filter
 } = options;

 const callbackRef = useRef(callback);
 const debounceTimerRef = useRef<number | null>(null);

 // Keep callback reference fresh
 useEffect(() => {
 callbackRef.current = callback;
 }, [callback]);

 useEffect(() => {
 logger.info('[useMutationObserver] Setting up observer...', { debounce, config });

 const debouncedCallback = () => {
 if (debounceTimerRef.current) {
 clearTimeout(debounceTimerRef.current);
 }

 debounceTimerRef.current = window.setTimeout(() => {
 logger.debug('[useMutationObserver] Executing callback');
 callbackRef.current();
 }, debounce);
 };

 const observer = new MutationObserver((mutations) => {
 const shouldTrigger = filter ? filter(mutations) : true;

 if (shouldTrigger) {
 debouncedCallback();
 }
 });

 observer.observe(document.body, config);
 logger.success('[useMutationObserver] Observer started');

 return () => {
 logger.debug('[useMutationObserver] Disconnecting observer');
 observer.disconnect();
 if (debounceTimerRef.current) {
 clearTimeout(debounceTimerRef.current);
 }
 };
 }, [debounce, filter, config]);
}