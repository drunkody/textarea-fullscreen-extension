import { useRef, useState, useCallback, useEffect } from 'react';

export const usePerformance = () => {
    const processCount = useRef(0);
    const lastProcessTime = useRef(Date.now());
    const [isKilled, setIsKilled] = useState(false);
    const timerRef = useRef(null);

    const checkPerformance = useCallback(() => {
        if (isKilled) return false;

        const now = Date.now();
        if (now - lastProcessTime.current > 5000) {
            processCount.current = 0;
            lastProcessTime.current = now;
        }

        processCount.current++;

        if (processCount.current > 100) {
            console.warn('[TextareaFullscreen] Performance issue detected. Killing extension on this page.');
            setIsKilled(true);
            return false;
        }
        return true;
    }, [isKilled]);

    const incrementProcessCount = useCallback(() => {
        processCount.current++;
    }, []);

    const kill = useCallback(() => {
        setIsKilled(true);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return {
        checkPerformance,
        incrementProcessCount,
        kill,
        isKilled
    };
};
