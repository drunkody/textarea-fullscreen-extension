import ReactDOM from 'react-dom/client';
import ContentApp from './ContentApp.tsx';

// ┌─────────────────────────────────────────────────┐
// │ ШАГ 2: Экспортируем WXT content script          │
// └─────────────────────────────────────────────────┘
export default defineContentScript({
  // ШАГ 3: На каких страницах запускать
  matches: ['<all_urls>'],  // Все сайты (можно ограничить)
  
  // ШАГ 4: Главная функция
  main(ctx) {
    console.log('Content script загружен!');
    
    // ┌────────────────────────────────────────────┐
    // │ ШАГ 5: Создаём UI интеграцию с WXT         │
    // └────────────────────────────────────────────┘
    const ui = createIntegratedUi(ctx, {
      position: 'inline',  // Встроить в DOM страницы
      anchor: 'body',
      // ШАГ 6: Что делать при монтировании
      onMount: (container) => {
        // container = <div> который WXT создал для нас
        
        // Создаём React корень
        const root = ReactDOM.createRoot(container);
        
        // Рендерим наше приложение
        root.render(<ContentApp />);
        
        // Возвращаем root для последующего удаления
        return root;
      },
      
      // ШАГ 7: Что делать при размонтировании
      onRemove: (root) => {
        // Очищаем React корень
        root?.unmount();
      },
    });
    
    // ШАГ 8: Монтируем UI на страницу
    ui.mount();
  },
});