/**
 * Custom hook for keyboard shortcuts
 * Provides reusable keyboard event handling with modifier key support
 */

import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

interface KeyboardShortcutOptions {
 ctrl?: boolean;
 alt?: boolean;
 shift?: boolean;
 enabled?: boolean;
 preventDefault?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 * @param key - The key to listen for ('f', 'Escape', 'Enter', etc.)
 * @param callback - Function to execute when key combination is pressed
 * @param options - Configuration for modifiers and behavior
 */
export function useKeyboardShortcut(
 key: string,
 callback: () => void,
 options: KeyboardShortcutOptions = {}
) {
 // Use ref to avoid re-creating event listener on callback change
 const callbackRef = useRef(callback);

 // Keep callback ref updated
 useEffect(() => {
 callbackRef.current = callback;
 }, [callback]);

 useEffect(() => {
 // Skip if disabled
 if (options.enabled === false) {
 logger.debug('[useKeyboardShortcut] Disabled, skipping listener');
 return;
 }

 const handleKeyDown = (e: KeyboardEvent) => {
 // Check modifier keys
 const ctrlMatch = options.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
 const altMatch = options.alt ? e.altKey : !e.altKey;
 const shiftMatch = options.shift ? e.shiftKey : !e.shiftKey;

 // Check key match (case-insensitive)
 const keyMatch = e.key.toLowerCase() === key.toLowerCase();

 if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
 logger.info(`[useKeyboardShortcut] Triggered: ${key}`, { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey });

 // Prevent browser default action (default: true)
 if (options.preventDefault !== false) {
 e.preventDefault();
 }

 // Execute callback
 callbackRef.current();
 }
 };

 logger.debug('[useKeyboardShortcut] Attaching listener', { key, options });
 document.addEventListener('keydown', handleKeyDown);

 return () => {
 logger.debug('[useKeyboardShortcut] Removing listener', { key });
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, [key, options.ctrl, options.alt, options.shift, options.enabled, options.preventDefault]);
}