import { useState, useEffect } from 'react';

export function useTextareaDetector() {
  // Создаём состояние для хранения найденных textarea  
  const [textareas, setTextareas] = useState<HTMLTextAreaElement[]>([]);
  // useEffect выполняется после монтирования компонента  
  useEffect(() => {
    // Ищем ВСЕ textarea на странице
    const elements = document.querySelectorAll('textarea');
    // Преобразуем NodeList в обычный массив
    setTextareas(Array.from(elements));

    console.log(`[useTextareaDetector] Found ${elements.length} textareas`);
  }, []); // Пустой массив = выполнится ОДИН раз при монтировании

  return { 
    textareas, 
    count: textareas.length 
    };
}
