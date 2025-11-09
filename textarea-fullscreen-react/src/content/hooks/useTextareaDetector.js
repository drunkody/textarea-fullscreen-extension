import { useState, useCallback } from 'react';

export const useTextareaDetector = () => {
    const [textareas, setTextareas] = useState([]);

    const getTextareaIdentifier = useCallback((textarea) => {
        if (!textarea) return '';
        const parts = [];
        if (textarea.id) parts.push(`id="${textarea.id}"`);
        if (textarea.name) parts.push(`name="${textarea.name}"`);
        if (textarea.className) parts.push(`class="${textarea.className.substring(0, 50)}"`);
        return parts.length > 0 ? parts.join(' ') : '<anonymous textarea>';
    }, []);

    const isTextareaValid = useCallback((textarea) => {
        const style = window.getComputedStyle(textarea);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return false;
        }

        const rect = textarea.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 15) {
            return false;
        }

        if (textarea.hasAttribute('readonly') || textarea.hasAttribute('disabled')) {
            return false;
        }

        let parent = textarea.parentElement;
        while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }, []);

    const processTextareas = useCallback(() => {
        const unprocessed = Array.from(document.querySelectorAll('textarea:not([data-tx-fullscreen-processed="true"])'));
        const validTextareas = [];

        for (const textarea of unprocessed) {
            textarea.setAttribute('data-tx-fullscreen-processed', 'true');
            if (isTextareaValid(textarea)) {
                validTextareas.push(textarea);
            }
            if (validTextareas.length >= 10) {
                break;
            }
        }

        if (validTextareas.length > 0) {
            setTextareas(prev => {
                const existing = new Set(prev);
                const combined = [...prev];
                for(const ta of validTextareas) {
                    if (!existing.has(ta)) {
                        combined.push(ta);
                    }
                }
                return combined;
            });
        }
    }, [isTextareaValid]);

    return {
        textareas,
        isTextareaValid,
        processTextareas,
        getTextareaIdentifier
    };
};
