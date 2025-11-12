/**
 * Hook for detecting scroll events (lazy-loaded content)
 * Triggers callback when user stops scrolling
 */

import { useEffect, useRef } from 'react';
import { DATA_ATTRIBUTES } from '../utils/constants';
import { logger } from '../utils/logger';

interface UseScrollDetectionOptions {
 /** Debounce delay in milliseconds */
 debounce?: number;
 /** Callback when scroll ends */
 onScrollEnd: () => void;
}

export function useScrollDetection({
 debounce = 300,
 onScrollEnd
}: UseScrollDetectionOptions) {
 const scrollTimerRef = useRef<number | null>(null);
 const callbackRef = useRef(onScrollEnd);

 useEffect(() => {
 callbackRef.current = onScrollEnd;
 }, [onScrollEnd]);

 useEffect(() => {
 logger.info('[useScrollDetection] Setting up scroll listener...', { debounce });

 const handleScroll = () => {
 if (scrollTimerRef.current) {
 clearTimeout(scrollTimerRef.current);
 }

 scrollTimerRef.current = window.setTimeout(() => {
 logger.debug('[useScrollDetection] Scroll ended, checking for new textareas');

 // Clean up orphaned markers (textareas marked but not wrapped)
 const orphaned = document.querySelectorAll(
 `textarea[${DATA_ATTRIBUTES.processed}="true"]`
 );

 orphaned.forEach(textarea => {
 if (!textarea.closest(`[${DATA_ATTRIBUTES.wrapper}]`)) {
 logger.warn('[useScrollDetection] Removing orphaned marker', textarea);
 textarea.removeAttribute(DATA_ATTRIBUTES.processed);
 }
 });

 callbackRef.current();
 }, debounce);
 };

 window.addEventListener('scroll', handleScroll, { passive: true });
 logger.success('[useScrollDetection] Scroll listener attached');

 return () => {
 logger.debug('[useScrollDetection] Removing scroll listener');
 window.removeEventListener('scroll', handleScroll);
 if (scrollTimerRef.current) {
 clearTimeout(scrollTimerRef.current);
 }
 };
 }, [debounce]);
}