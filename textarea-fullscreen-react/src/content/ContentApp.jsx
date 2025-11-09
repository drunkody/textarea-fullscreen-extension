import { useEffect, useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { usePerformance } from './hooks/usePerformance';
import { useTextareaDetector } from './hooks/useTextareaDetector';
import { useObserver } from './hooks/useObserver';
import { TextareaWrapper } from './components/TextareaWrapper/TextareaWrapper';

export const ContentApp = () => {
    const { settings, loading, shouldRunOnCurrentDomain } = useSettings();
    const { checkPerformance, isKilled } = usePerformance();
    const { textareas, processTextareas } = useTextareaDetector();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!settings.enabled || !shouldRunOnCurrentDomain()) {
            console.log('[TextareaFullscreen] Disabled on this domain');
            return;
        }

        setTimeout(() => {
            if (checkPerformance()) {
                processTextareas();
                setInitialized(true);
            }
        }, 1000);
    }, [loading, settings.enabled, shouldRunOnCurrentDomain, checkPerformance, processTextareas]);

    useObserver(() => {
        if (!isKilled && checkPerformance()) {
            processTextareas();
        }
    });

    if (loading || !initialized || isKilled) {
        return null;
    }

    return (
        <>
            {textareas.map((textarea, index) => (
                <TextareaWrapper
                    key={`textarea-${index}`}
                    textarea={textarea}
                />
            ))}
        </>
    );
};
