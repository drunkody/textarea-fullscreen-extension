/**
 * Функция для подсчёта textarea на странице
 */
export function getTextareaCount(): number {
  // Ищем все textarea и возвращаем их количество
  return document.querySelectorAll('textarea').length;
}

/**
 * Функция для подсветки элемента
 * @param element - HTML элемент для подсветки
 * @param color - Цвет обводки (по умолчанию жёлтый)
 */
export function highlightElement(element: HTMLElement, color: string = 'yellow') {
  // Добавляем CSS outline (обводку) вокруг элемента
  element.style.outline = `3px solid ${color}`;
}

/**
 * Функция для удаления подсветки
 */
export function removeHighlight(element: HTMLElement) {
  // Убираем обводку
  element.style.outline = '';
}