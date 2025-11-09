import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FullscreenButton } from '../FullscreenButton/FullscreenButton';
import './styles.css';

export const FullscreenEditor = ({
    textarea,
    isExpanded,
    onToggle
}) => {
    const textareaCloneRef = useRef(null);

    useEffect(() => {
        if (isExpanded && textarea && textareaCloneRef.current) {
            const clone = textareaCloneRef.current;
            clone.value = textarea.value;
            clone.focus();

            const syncContent = (e) => {
                textarea.value = e.target.value;
            };
            clone.addEventListener('input', syncContent);

            return () => {
                clone.removeEventListener('input', syncContent);
            };
        }
    }, [isExpanded, textarea]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isExpanded) {
                onToggle();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded, onToggle]);

    if (!isExpanded) return null;

    return createPortal(
        <div className="tx-fullscreen-editor">
            <textarea
                ref={textareaCloneRef}
                className="tx-fullscreen-textarea"
                defaultValue={textarea?.value}
            />
            <FullscreenButton onClick={onToggle} isExpanded={isExpanded} />
        </div>,
        document.body
    );
};
