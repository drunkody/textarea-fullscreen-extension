import { useState, useCallback, useRef, useEffect } from 'react';

export const useFullscreen = (textarea) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const originalState = useRef(null);

    const expand = useCallback(() => {
        if (!textarea) return;

        originalState.current = {
            parent: textarea.parentElement,
            nextSibling: textarea.nextSibling,
            styles: {
                width: textarea.style.width,
                height: textarea.style.height,
                position: textarea.style.position,
                zIndex: textarea.style.zIndex,
            }
        };

        setIsExpanded(true);
    }, [textarea]);

    const minimize = useCallback(() => {
        setIsExpanded(false);
    }, []);

    useEffect(() => {
        if (!isExpanded && originalState.current && textarea) {
            const { parent, nextSibling, styles } = originalState.current;
            if (parent) {
                parent.insertBefore(textarea, nextSibling);
            }
            Object.assign(textarea.style, styles);
            originalState.current = null;
        }
    }, [isExpanded, textarea]);

    const toggle = useCallback(() => {
        if (isExpanded) {
            minimize();
        } else {
            expand();
        }
    }, [isExpanded, expand, minimize]);

    return {
        isExpanded,
        toggle,
        expand,
        minimize
    };
};
