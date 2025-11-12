/**
 * Главный компонент content script
 * Отображает бейдж с количеством найденных textarea
 */

// import { useTextareaDetector } from '../../hooks/useTextareaDetector';
// import { Badge } from '../../components/Badge';

export default function ContentApp() {
  // Используем хук для поиска textarea
  // textareas - массив найденных элементов
  const { textareas } = useTextareaDetector();

  return (
    <div
      style={{
        // Фиксированная позиция (не скроллится)
        position: 'fixed',
        
        // Позиция: правый верхний угол
        top: '10px',
        right: '10px',
        
        // Высокий z-index (всегда сверху)
        zIndex: 999999,
        
        // Белый фон
        background: 'white',
        
        // Внутренние отступы
        padding: '10px',
        
        // Скруглённые углы
        borderRadius: '4px',
        
        // Тень для глубины
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        
        // Системный шрифт
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Бейдж с динамическим цветом */}
      <Badge 
        color={
          // Если найдены textarea - зелёный, иначе - серый
          textareas.length > 0 ? '#4caf50' : '#9e9e9e'
        }
      >
        {/* Иконка галочки */}
        ✅
        
        {/* Количество textarea */}
        {' '}{textareas.length} валидных textarea
        
        {/* Добавляем 's' для множественного числа */}
        {textareas.length !== 1 ? 's' : ''}
      </Badge>
    </div>
  );
}