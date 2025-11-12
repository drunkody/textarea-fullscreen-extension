import ReactDOM from 'react-dom/client';
import ContentApp from './ContentApp.tsx';


export default defineContentScript({
  matches: ['<all_urls>'],
  
  main(ctx) {
    logger.success('Content script loaded!', {
      url: window.location.href,
      mode: import.meta.env.MODE
    });
    
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      
      onMount: (container) => {
        logger.info('Mounting React app...');
        
        const root = ReactDOM.createRoot(container);
        root.render(<ContentApp />);
        
        logger.success('React app mounted!');
        
        return root;
      },
      
      onRemove: (root) => {
        logger.info('Unmounting React app...');
        root?.unmount();
        logger.success('React app unmounted!');
      },
    });
    
    ui.mount();
  },
});