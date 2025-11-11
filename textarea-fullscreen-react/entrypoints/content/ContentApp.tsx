// ВОТ ЧТО WXT СДЕЛАЕТ ЗА КУЛИСАМИ:
// import { useTextareaDetector } from '../../hooks/useTextareaDetector';
// import { Badge } from '../../components/Badge';
// ═══════════════════════════════════════════════════════════
// import { Badge } from '../../components/Badge';
export default function ContentApp() {

  // Badge()
  
  const { textareas, count } = useTextareaDetector();

  
  // Как это работает:
  // 1. useTextareaDetector() выполняется
  // 2. Внутри хука useEffect ищет все textarea
  // 3. Возвращает { textareas: [...], count: 5 }
  // 4. Мы деструктурируем результат

  console.log('[ContentApp] Рендеринг с', count, 'textarea элементами');
  return (
    <div
      style={{
        position: 'fixed',  // Фиксированная позиция (не скроллится)
        top: 10,            // 10px от верха экрана
        right: 10,          // 10px справа
        zIndex: 999999,     // Поверх всех элементов страницы
      }}
    >
      <Badge color="#0066cc">
        Найдено {count} textarea{count !== 1 ? '' : ''}
      </Badge>
    </div>
  );
}