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

// Z-index for UI elements
export const Z_INDEX = {
  button: 99999999, // кнопка на textarea
  editor: 2147483647 // полноэкранный редактор (максимальный z-index)
} as const;

// Button sizes
export const BUTTON_SIZE = {
  normal: 30, // обычное состояние
  icon: 18, // размер иконки внутри кнопки
  hover: 36, // при наведении
  active: 28 // при нажатии
} as const;

// Горячие клавиши
export const KEYBOARD_SHORTCUTS = {
  closeEditor: 'Escape', // ✅ Add this
  defaultToggle: 'f', // Default shortcut key
} as const;

// Debounce delays (milliseconds)
export const DEBOUNCE_DELAYS = {
  mutation: 150, // MutationObserver callback delay
  scroll: 300, // Scroll event delay
  resize: 200, // Resize event delay (future)
} as const;

// Storage keys
export const STORAGE_KEYS = {
  settings: 'settings',
  lastSync: 'lastSync',
} as const;