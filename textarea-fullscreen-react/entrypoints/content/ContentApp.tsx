
export default function ContentApp() {
  //возвращает див элемент с фиксированной позицией в правом верхнем углу 
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'white',
      padding: '10px',
      border: '2px solid #54bc4a',
      borderRadius: '4px',
      zIndex: 999999, // Высокий z-index (999999) для видимости
      fontFamily: 'sans-serif',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      color: '#333'
    }}>
      ✅ Расширение активно
    </div>
  );
}