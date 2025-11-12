/**
 * Константы для настройки поведения расширения
 * Все значения в одном месте для удобства изменения
 */

// Минимальные размеры textarea для обработки
// Слишком маленькие поля (скрытые) игнорируются
export const TEXTAREA_MIN_SIZE = {
  width: 50,   // минимальная ширина в пикселях
  height: 15   // минимальная высота в пикселях
} as const;

// Максимальное количество textarea для обработки за раз
// Защита от зависания браузера при большом количестве элементов
export const MAX_BATCH_SIZE = 10;

// Имена data-атрибутов для маркировки элементов
export const DATA_ATTRIBUTES = {
  processed: 'data-tx-processed',  // помечает уже обработанные textarea
  wrapper: 'data-tx-wrapper'       // помечает обёртку вокруг textarea
} as const;

// Z-index для элементов UI (чтобы всегда были сверху)
export const Z_INDEX = {
  button: 99999999,        // кнопка на textarea
  overlay: 2147483646,   // затемнённый фон
  editor: 2147483647     // полноэкранный редактор (максимальный z-index)
} as const;

// Размеры кнопки в разных состояниях
export const BUTTON_SIZE = {
  normal: 30,    // обычное состояние
  expanded: 32   // в полноэкранном режиме
} as const;

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  toggleFullscreen: '8', // Ctrl+8 to toggle fullscreen
  closeEditor: 'Escape', // Escape to close editor
  save: 's', // Ctrl+S to save (future)
  help: '?', // Show shortcuts help (future)
} as const;

// Storage keys
export const STORAGE_KEYS = {
  settings: 'settings',
  lastSync: 'lastSync',
} as const;