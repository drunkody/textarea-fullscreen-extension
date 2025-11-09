import { useEffect, useRef } from 'react';

export const useObserver = (onNewTextarea) => {
    const observerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const onNewTextareaRef = useRef(onNewTextarea);

    useEffect(() => {
        onNewTextareaRef.current = onNewTextarea;
    }, [onNewTextarea]);

    useEffect(() => {
        const throttledProcess = () => {
            if (onNewTextareaRef.current) {
                onNewTextareaRef.current();
            }
        };

        const observer = new MutationObserver((mutations) => {
            let hasNewTextarea = false;
            for (const mutation of mutations.slice(0, 10)) {
                if (mutation.target.closest && mutation.target.closest('#textarea-fullscreen-root')) {
                    continue;
                }
                if (mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'TEXTAREA' || node.querySelector('textarea')) {
                                hasNewTextarea = true;
                                break;
                            }
                        }
                    }
                }
                if (hasNewTextarea) break;
            }

            if (hasNewTextarea) {
                throttledProcess();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        observerRef.current = observer;

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                const unprocessed = document.querySelectorAll('textarea[data-tx-fullscreen-processed="true"]');
                unprocessed.forEach(ta => {
                    if(!ta.closest('[data-tx-wrapper]')) {
                        ta.removeAttribute('data-tx-fullscreen-processed');
                    }
                });
                if (onNewTextareaRef.current) {
                    onNewTextareaRef.current();
                }
            }, 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return {};
};
