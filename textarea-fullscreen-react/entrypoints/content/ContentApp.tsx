/**
 * Главный компонент content script
 * ИСПРАВЛЕНО: Кнопка всегда сверху, даже при фокусе textarea
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTextareaDetector } from '../../hooks/useTextareaDetector';
import { Badge } from '../../components/Badge';
import { FullscreenButton } from '../../components/FullscreenButton';
import { DATA_ATTRIBUTES, Z_INDEX } from '../../utils/constants';
import { logger } from '../../utils/logger';

export default function ContentApp() {
  const { textareas } = useTextareaDetector();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const containersRef = useRef<Map<HTMLTextAreaElement, HTMLDivElement>>(new Map());
  const [containersReady, setContainersReady] = useState(0);

  useEffect(() => {
    if (textareas.length === 0) return;

    logger.group('🔍 [ContentApp] Textarea Detection');
    logger.info('Total textareas found', textareas.length);
    
    textareas.forEach((textarea, index) => {
      logger.group(`📝 Textarea #${index}`, true);
      logger.debug('Element', textarea);
      logger.log('Class:', textarea.className);
      logger.log('Placeholder:', textarea.placeholder);
      
      const rect = textarea.getBoundingClientRect();
      logger.log('Position:', { top: rect.top, left: rect.left });
      logger.log('Size:', { width: rect.width, height: rect.height });
      
      logger.groupEnd();
    });
    
    logger.groupEnd();
  }, [textareas]);

  // ===== Создаём контейнеры для кнопок =====
  useEffect(() => {
    if (textareas.length === 0) return;

    logger.time('⏱️ Button container creation');
    logger.info('[ContentApp] Creating button containers...');
    
    let newContainersCreated = 0;

    textareas.forEach((textarea, index) => {
      if (containersRef.current.has(textarea)) {
        logger.debug(`Container already exists for textarea #${index}`);
        return;
      }

      logger.group(`📦 Creating button container for textarea #${index}`, true);
      
      const parent = textarea.parentElement;
      if (!parent) {
        logger.error('No parent element found for textarea', textarea);
        logger.groupEnd();
        return;
      }

      const existingContainer = parent.querySelector(
        `[${DATA_ATTRIBUTES.wrapper}][data-textarea-id="${textarea.id || index}"]`
      ) as HTMLDivElement;
      
      if (existingContainer) {
        logger.success('Container already exists in DOM');
        containersRef.current.set(textarea, existingContainer);
        newContainersCreated++;
        logger.groupEnd();
        return;
      }

      // ===== Создаём контейнер для кнопки =====
      const buttonContainer = document.createElement('div');
      buttonContainer.setAttribute(DATA_ATTRIBUTES.wrapper, 'true');
      buttonContainer.setAttribute('data-textarea-id', textarea.id || String(index));
      
      // ===== ИСПРАВЛЕНИЕ: Увеличен z-index контейнера =====
      buttonContainer.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: none !important;
        pointer-events: none !important;
        z-index: ${Z_INDEX.button} !important;
      `.replace(/\s+/g, ' ').trim();

      if (logger.isEnabled()) {
        buttonContainer.style.outline = '1px dotted rgba(0, 255, 0, 0.3)';
        buttonContainer.style.outlineOffset = '0px';
      }

      // ===== Делаем parent позиционированным =====
      const parentStyles = window.getComputedStyle(parent);
      if (parentStyles.position === 'static') {
        logger.log('Making parent positioned (relative)');
        parent.style.position = 'relative';
      }

      logger.log('Parent:', parent.tagName);
      logger.log('Parent position:', window.getComputedStyle(parent).position);
      
      parent.appendChild(buttonContainer);
      
      logger.success('Button container created');
      logger.log('Container z-index:', Z_INDEX.button);
      
      containersRef.current.set(textarea, buttonContainer);
      newContainersCreated++;
      
      logger.groupEnd();
    });

    if (newContainersCreated > 0) {
      logger.success(
        `Created ${newContainersCreated} button container${newContainersCreated > 1 ? 's' : ''}`
      );
      logger.info(`Total containers in ref: ${containersRef.current.size}`);
      
      setContainersReady(prev => prev + 1);
    }

    logger.timeEnd('⏱️ Button container creation');

    return () => {
      logger.debug('[ContentApp] Cleanup: removing button containers...');
      
      const currentTextareas = new Set(textareas);
      const toRemove: HTMLTextAreaElement[] = [];
      
      containersRef.current.forEach((container, textarea) => {
        if (!currentTextareas.has(textarea)) {
          logger.debug('Removing container for deleted textarea');
          toRemove.push(textarea);
          container.remove();
        }
      });
      
      toRemove.forEach(ta => containersRef.current.delete(ta));
      
      if (toRemove.length > 0) {
        logger.info(`Cleaned up ${toRemove.length} container${toRemove.length > 1 ? 's' : ''}`);
      }
    };
  }, [textareas]);

  // ===== НОВОЕ: Отслеживаем фокус и проверяем z-index =====
  useEffect(() => {
    const handleFocus = (textarea: HTMLTextAreaElement) => {
      logger.group('🔍 [ContentApp] Textarea focused - checking z-index', true);
      
      const container = containersRef.current.get(textarea);
      if (!container) {
        logger.warn('No container found for focused textarea');
        logger.groupEnd();
        return;
      }

      // Проверяем, что кнопка видна
      const button = container.querySelector('.tx-fullscreen-btn') as HTMLElement;
      if (!button) {
        logger.warn('No button found in container');
        logger.groupEnd();
        return;
      }

      // Получаем элемент под кнопкой
      const buttonRect = button.getBoundingClientRect();
      const elementUnderButton = document.elementFromPoint(
        buttonRect.left + buttonRect.width / 2,
        buttonRect.top + buttonRect.height / 2
      );

      logger.log('Element under button:', elementUnderButton);
      logger.log('Button:', button);

      // Если под кнопкой не кнопка - что-то перекрывает
      if (elementUnderButton && elementUnderButton !== button) {
        const underStyles = window.getComputedStyle(elementUnderButton);
        logger.warn('Button is covered!', {
          coveringElement: elementUnderButton,
          coveringZIndex: underStyles.zIndex,
          buttonZIndex: window.getComputedStyle(button).zIndex,
          containerZIndex: window.getComputedStyle(container).zIndex
        });

        // ===== ИСПРАВЛЕНИЕ: Принудительно поднимаем z-index =====
        const coveringZIndex = parseInt(underStyles.zIndex) || 0;
        if (coveringZIndex >= Z_INDEX.button) {
          const newZIndex = coveringZIndex + 1;
          logger.info(`Increasing z-index to ${newZIndex}`);
          container.style.zIndex = String(newZIndex);
        }
      } else {
        logger.success('Button is visible and clickable');
      }

      logger.groupEnd();
    };

    // Добавляем обработчики фокуса на все textarea
    const focusHandlers = new Map<HTMLTextAreaElement, () => void>();
    
    textareas.forEach(textarea => {
      const handler = () => handleFocus(textarea);
      textarea.addEventListener('focus', handler);
      focusHandlers.set(textarea, handler);
    });

    // Cleanup
    return () => {
      focusHandlers.forEach((handler, textarea) => {
        textarea.removeEventListener('focus', handler);
      });
    };
  }, [textareas]);

  const handleButtonClick = useCallback((index: number) => {
    logger.info(`Button clicked for textarea #${index}`);
    logger.debug('State change', {
      current: expandedIndex,
      new: expandedIndex === index ? null : index
    });
    
    setExpandedIndex(expandedIndex === index ? null : index);
  }, [expandedIndex]);

  return (
    <>
      {/* Индикатор */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 999999,
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <Badge 
          color={textareas.length > 0 ? '#4caf50' : '#9e9e9e'}
        >
          ✅ {textareas.length} textarea{textareas.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Кнопки */}
      {textareas.map((textarea, index) => {
        const container = containersRef.current.get(textarea);
        
        if (!container) {
          return null;
        }

        logger.debug(`Rendering portal for textarea #${index}`);

        return createPortal(
          <FullscreenButton
            onClick={() => handleButtonClick(index)}
            isExpanded={expandedIndex === index}
          />,
          container,
          `button-${index}`
        );
      })}
    </>
  );
}