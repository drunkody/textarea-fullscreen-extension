import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './styles.css';

export const Overlay = ({ onClose, visible }) => {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (visible) {
            requestAnimationFrame(() => {
                setOpacity(1);
            });
        }
    }, [visible]);

    const handleClose = () => {
        setOpacity(0);
        setTimeout(onClose, 300);
    };

    return createPortal(
        <div
            className="tx-editor-overlay"
            onClick={handleClose}
            style={{ opacity }}
        />,
        document.body
    );
};
