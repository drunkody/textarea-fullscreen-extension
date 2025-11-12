/**
 * Хук useTextareaDetector - поиск и валидация textarea на странице
 * Главная логика обнаружения текстовых полей
 */

import { useState, useEffect, useCallback } from 'react';
import { TEXTAREA_MIN_SIZE, MAX_BATCH_SIZE, DATA_ATTRIBUTES } from '../utils/constants';
import { logger } from '../utils/logger';

export function useTextareaDetector() {
  // State для хранения массива найденных textarea
  const [textareas, setTextareas] = useState<HTMLTextAreaElement[]>([]);

  /**
   * Проверка валидности textarea
   * Возвращает true если textarea можно обрабатывать
   */
  const isTextareaValid = useCallback((textarea: HTMLTextAreaElement): boolean => {
    logger.group(`🔍 Validating textarea`, true);
    
    // Получаем реальные CSS-свойства (с учётом всех стилей)
    const style = window.getComputedStyle(textarea);
    
    // Пропускаем скрытые элементы
    if (style.display === 'none' || style.visibility === 'hidden') {
      logger.debug('❌ Hidden (display/visibility)');
      logger.groupEnd();
      return false;
    }
    
    // Пропускаем полностью прозрачные элементы
    if (parseFloat(style.opacity) === 0) {
      logger.debug('❌ Hidden (opacity: 0)');
      logger.groupEnd();
      return false;
    }

    // === ПРОВЕРКА 2: Размер элемента ===
    
    // Получаем размеры и позицию элемента
    const rect = textarea.getBoundingClientRect();
    
    // Пропускаем слишком маленькие textarea (скрытые поля)
    if (rect.width < TEXTAREA_MIN_SIZE.width || rect.height < TEXTAREA_MIN_SIZE.height) {
      logger.debug('❌ Too small', { 
        width: rect.width, 
        height: rect.height,
        minWidth: TEXTAREA_MIN_SIZE.width,
        minHeight: TEXTAREA_MIN_SIZE.height
      });
      logger.groupEnd();
      return false;
    }

    // === ПРОВЕРКА 3: Атрибуты ===
    if (textarea.hasAttribute('readonly') || textarea.hasAttribute('disabled')) {
      logger.debug('❌ Readonly or disabled');
      logger.groupEnd();
      return false;
    }

    // === ПРОВЕРКА 4: Видимость родителей ===
    let parent = textarea.parentElement;
    
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        logger.debug('❌ Hidden parent', parent);
        logger.groupEnd();
        return false;
      }
      
      parent = parent.parentElement;
    }

    // Все проверки пройдены - textarea валидна!
    return true;
  }, []);

  /**
   * Обработка textarea на странице
   * Находит и валидирует элементы
   */
  const processTextareas = useCallback(() => {
    // Ищем все textarea БЕЗ атрибута data-tx-processed
    // CSS-селектор :not() очень быстрый
    const unprocessed = document.querySelectorAll<HTMLTextAreaElement>(
      `textarea:not([${DATA_ATTRIBUTES.processed}])`
    );
    
    // Массив для валидных textarea
    const validTextareas: HTMLTextAreaElement[] = [];

    // Перебираем каждую необработанную textarea
    for (const textarea of unprocessed) {
      // СРАЗУ помечаем как обработанную (чтобы не проверять повторно)
      textarea.setAttribute(DATA_ATTRIBUTES.processed, 'true');
      
      // Проверяем валидность
      if (isTextareaValid(textarea)) {
        // Добавляем в массив валидных
        validTextareas.push(textarea);
        logger.debug('Added to valid list', {
          id: textarea.id || '(no id)',
          class: textarea.className || '(no class)'
        });
      }
      
      // Ограничение пакета: обрабатываем максимум 10 за раз
      if (validTextareas.length >= MAX_BATCH_SIZE) {
        logger.warn(`Reached batch limit (${MAX_BATCH_SIZE})`);
        break;
      }
    }

    // Обновляем state если нашли новые textarea
    if (validTextareas.length > 0) {
      logger.success(`Found ${validTextareas.length} valid textarea(s)`);
      
      setTextareas(prev => {
        // Создаём Set для быстрой проверки наличия
        const existing = new Set(prev);
        
        // Копируем существующий массив
        const combined = [...prev];
        
        // Добавляем только новые элементы (избегаем дубликатов)
        for (const ta of validTextareas) {
          if (!existing.has(ta)) {
            combined.push(ta);
          }
        }
        
        // Возвращаем обновлённый массив
        return combined;
      });
    } else {
      logger.debug('No valid textareas found');
    }
    
    logger.groupEnd();
    logger.timeEnd('⏱️ Process textareas');
  }, [isTextareaValid]);

  // Запуск обнаружения при монтировании компонента
  useEffect(() => {
    logger.info('[useTextareaDetector] Hook mounted, starting detection...');
    processTextareas();
  }, [processTextareas]);

  // Возвращаем данные и функции для использования
  return { 
    textareas,
    processTextareas
  };
}