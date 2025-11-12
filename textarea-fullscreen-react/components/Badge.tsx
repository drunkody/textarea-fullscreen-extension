// Определяем TypeScript интерфейс для пропсов
interface BadgeProps {
  children: React.ReactNode;  // Что будет внутри <Badge>...</Badge>
  color?: string;             // Опциональный цвет (по умолчанию зелёный)
}


export function Badge({ children, color = '#54bc4a' }: BadgeProps) {
  // Возвращает JSX (HTML-подобный код) 
  return (
    <div
      style={{
        // Inline стили для красивого оформления
        background: color,              // Фон = переданный цвет
        color: 'white',                 // Белый текст
        padding: '8px 12px',            // Внутренние отступы
        borderRadius: '6px',            // Скруглённые углы
        fontSize: '14px',               // Размер шрифта
        fontWeight: 'bold',             // Жирный текст
        display: 'inline-block',        // Подстраивается под контент
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',  // Тень для объёма
      }}
    >
      {/* Рендерим дочерние элементы */}
      {children}
    </div>
  );
}