/**
 * Утилита для логирования с автоматическим отключением в production
 * В dev режиме - полные логи, в production - тишина
 */

// Определяем режим разработки
const IS_DEV = import.meta.env.MODE === 'development';

// Цвета для красивых логов (только в dev)
const COLORS = {
  info: '#3b82f6',    // синий
  success: '#10b981', // зелёный
  warning: '#f59e0b', // оранжевый
  error: '#ef4444',   // красный
  debug: '#8b5cf6',   // фиолетовый
} as const;

/**
 * Класс для структурированного логирования
 */
class Logger {
  private enabled: boolean;

  constructor(enabled: boolean = IS_DEV) {
    this.enabled = enabled;
  }

  /**
   * Обычный лог
   */
  log(...args: any[]): void {
    if (!this.enabled) return;
    console.log(...args);
  }

  /**
   * Информационное сообщение
   */
  info(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.log(
      `%c ℹ️ ${message}`,
      `color: ${COLORS.info}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Успешное выполнение
   */
  success(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.log(
      `%c ✅ ${message}`,
      `color: ${COLORS.success}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Предупреждение
   */
  warn(message: string, ...args: any[]): void {
    if (!this.enabled) return;
    console.warn(
      `%c ⚠️ ${message}`,
      `color: ${COLORS.warning}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Ошибка (показываем даже в production)
   */
  error(message: string, ...args: any[]): void {
    // Ошибки логируем всегда!
    console.error(
      `%c ❌ ${message}`,
      `color: ${COLORS.error}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Отладочная информация
   */
  debug(message: string, data?: any): void {
    if (!this.enabled) return;
    console.log(
      `%c 🔍 ${message}`,
      `color: ${COLORS.debug}; font-weight: bold`
    );
    if (data !== undefined) {
      console.log(data);
    }
  }

  /**
   * Начать группу логов
   */
  group(label: string, collapsed: boolean = false): void {
    if (!this.enabled) return;
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  /**
   * Закрыть группу логов
   */
  groupEnd(): void {
    if (!this.enabled) return;
    console.groupEnd();
  }

  /**
   * Таблица (удобно для массивов объектов)
   */
  table(data: any): void {
    if (!this.enabled) return;
    console.table(data);
  }

  /**
   * Таймер (замеряем производительность)
   */
  time(label: string): void {
    if (!this.enabled) return;
    console.time(label);
  }

  /**
   * Завершить таймер
   */
  timeEnd(label: string): void {
    if (!this.enabled) return;
    console.timeEnd(label);
  }

  /**
   * Проверить, включено ли логирование
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Включить/выключить логирование вручную
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Экспортируем синглтон
export const logger = new Logger();

// Экспортируем также для создания отдельных логгеров
export { Logger };

// Экспортируем флаг режима разработки
export { IS_DEV };