/**
 * Хук useTextareaDetector - поиск и валидация textarea на странице
 * Главная логика обнаружения текстовых полей
 */

import { useState, useEffect, useCallback } from 'react';
import { TEXTAREA_MIN_SIZE, MAX_BATCH_SIZE, DATA_ATTRIBUTES } from '../utils/constants';

export function useTextareaDetector() {
  // State для хранения массива найденных textarea
  const [textareas, setTextareas] = useState<HTMLTextAreaElement[]>([]);

  /**
   * Проверка валидности textarea
   * Возвращает true если textarea можно обрабатывать
   */
  const isTextareaValid = useCallback((textarea: HTMLTextAreaElement): boolean => {
    // === ПРОВЕРКА 1: Видимость элемента ===
    
    // Получаем реальные CSS-свойства (с учётом всех стилей)
    const style = window.getComputedStyle(textarea);
    
    // Пропускаем скрытые элементы
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    // Пропускаем полностью прозрачные элементы
    if (parseFloat(style.opacity) === 0) {
      return false;
    }

    // === ПРОВЕРКА 2: Размер элемента ===
    
    // Получаем размеры и позицию элемента
    const rect = textarea.getBoundingClientRect();
    
    // Пропускаем слишком маленькие textarea (скрытые поля)
    if (rect.width < TEXTAREA_MIN_SIZE.width || rect.height < TEXTAREA_MIN_SIZE.height) {
      return false;
    }

    // === ПРОВЕРКА 3: Атрибуты ===
    
    // Пропускаем textarea только для чтения или отключенные
    if (textarea.hasAttribute('readonly') || textarea.hasAttribute('disabled')) {
      return false;
    }

    // === ПРОВЕРКА 4: Видимость родителей ===
    
    // Поднимаемся вверх по дереву DOM
    let parent = textarea.parentElement;
    
    // Проверяем каждого родителя до <body>
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      
      // Если родитель скрыт - textarea тоже скрыта
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }
      
      // Переходим к следующему родителю
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
      }
      
      // Ограничение пакета: обрабатываем максимум 10 за раз
      if (validTextareas.length >= MAX_BATCH_SIZE) {
        break; // Выходим из цикла
      }
    }

    // Обновляем state если нашли новые textarea
    if (validTextareas.length > 0) {
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
    }
  }, [isTextareaValid]);

  // Запуск обнаружения при монтировании компонента
  useEffect(() => {
    processTextareas();
  }, [processTextareas]);

  // Возвращаем данные и функции для использования
  return { 
    textareas,          // массив найденных textarea
    processTextareas    // функция для повторного поиска
  };
}