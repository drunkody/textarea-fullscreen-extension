import { createRoot } from 'react-dom/client';
import ContentApp from './ContentApp';

export default defineContentScript({
  matches: ['<all_urls>'], // Компонент рендерится на каждой веб-странице ('<all_urls>')
                            // или только на определенной страницах с доменом ('*://*.google.com/*')
  main() {
    // Создаем html контейнер for React app
    const container = document.createElement('div');
    container.id = 'textarea-fullscreen-root';
    document.body.appendChild(container);

    // создаем root элемент для отображения React компонентов внутри браузерного DOM ноды. 
    const root = createRoot(container);
    root.render(<ContentApp />);
  },
});
