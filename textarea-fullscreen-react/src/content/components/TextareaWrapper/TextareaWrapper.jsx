import { useRef, useEffect } from 'react';
import { FullscreenButton } from '../FullscreenButton/FullscreenButton';
import { FullscreenEditor } from '../FullscreenEditor/FullscreenEditor';
import { Overlay } from '../Overlay/Overlay';
import { useSettings } from '../../hooks/useSettings';
import { useFullscreen } from '../../hooks/useFullscreen';
import './styles.css';

export const TextareaWrapper = ({ textarea }) => {
    const { settings } = useSettings();
    const { isExpanded, toggle } = useFullscreen(textarea);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (textarea && wrapperRef.current) {
            const parent = textarea.parentElement;
            if (parent && !wrapperRef.current.contains(textarea)) {
                parent.insertBefore(wrapperRef.current, textarea);
                wrapperRef.current.appendChild(textarea);
            }
        }
    }, [textarea]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === settings.shortcutKey) {
                e.preventDefault();
                toggle();
            }
        };

        textarea?.addEventListener('keydown', handleKeyDown);
        return () => textarea?.removeEventListener('keydown', handleKeyDown);
    }, [textarea, settings.shortcutKey, toggle]);

    return (
        <div ref={wrapperRef} className="tx-editor-wrapper" data-tx-wrapper>
            <FullscreenButton
                onClick={toggle}
                isExpanded={isExpanded}
            />
            {isExpanded && settings.overlay && (
                <Overlay
                    onClose={toggle}
                    visible={isExpanded}
                />
            )}
            <FullscreenEditor
                textarea={textarea}
                isExpanded={isExpanded}
                onToggle={toggle}
            />
        </div>
    );
};
