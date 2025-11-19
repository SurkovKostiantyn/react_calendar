import React, { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Legend);

const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

const MonthStatsChart = ({ byMonth, year, onBarClick }) => {
  const chartRef = useRef();
  return (
    <Bar
      ref={chartRef}
      data={{
        labels: monthNames,
        datasets: [
          {
            label: `Кількість днів у ${year}`,
            data: byMonth,
            backgroundColor: '#8e24aa',
            borderRadius: 6,
            maxBarThickness: 32,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
        onClick: (event) => {
          // Перевірка наявності callback функції - якщо немає, нічого не робимо
          if (!onBarClick) return;
          
          // Перевірка наявності ref до графіка
          if (!chartRef.current) {
            console.warn('Chart ref is not available');
            return;
          }
          
          // Отримуємо об'єкт графіка з ref
          const chart = chartRef.current;
          
          // Перевірка наявності об'єкта графіка
          if (!chart) {
            console.warn('Chart instance is not available');
            return;
          }
          
          // Перевірка наявності методу getElementsAtEventForMode у Chart.js API
          // Цей метод може бути недоступний у деяких версіях Chart.js або якщо графік ще не ініціалізований
          if (typeof chart.getElementsAtEventForMode !== 'function') {
            console.warn('Chart.getElementsAtEventForMode method is not available. Chart.js version might be incompatible.');
            return;
          }
          
          // Перевірка наявності нативного event об'єкта
          // Chart.js передає об'єкт event з полем native, яке містить оригінальну подію
          if (!event) {
            console.warn('Event object is not available');
            return;
          }
          
          if (!event.native) {
            console.warn('Event.native is not available');
            return;
          }
          
          try {
            // Отримуємо елементи графіка, на які клікнули
            // Параметри методу getElementsAtEventForMode:
            // - event.native: оригінальна подія кліку
            // - 'nearest': режим пошуку найближчого елемента до точки кліку
            // - { intersect: true }: тільки якщо клік перетинається з елементом графіка
            // - true: використовувати кешовані результати для кращої продуктивності
            const elements = chart.getElementsAtEventForMode(
              event.native, 
              'nearest', 
              { intersect: true }, 
              true
            );
            
            // Перевірка наявності елементів та їх кількості
            // Якщо масив порожній або не є масивом, клік був не на елементі графіка
            if (!elements) {
              return; // Метод повернув null/undefined
            }
            
            if (!Array.isArray(elements)) {
              console.warn('getElementsAtEventForMode returned non-array:', typeof elements);
              return;
            }
            
            if (elements.length === 0) {
              return; // Клік не на елементі графіка (наприклад, на фоні)
            }
            
            // Отримуємо перший елемент (найближчий до точки кліку)
            const firstElement = elements[0];
            
            // Перевірка наявності елемента та його властивості index
            if (!firstElement) {
              console.warn('First element is null or undefined');
              return;
            }
            
            // Перевірка валідності індексу місяця
            // Індекс повинен бути числом від 0 до 11 (12 місяців)
            if (typeof firstElement.index !== 'number') {
              console.warn('Element index is not a number:', firstElement.index);
              return;
            }
            
            if (firstElement.index < 0 || firstElement.index >= 12) {
              console.warn('Element index is out of range (0-11):', firstElement.index);
              return;
            }
            
            // Всі перевірки пройдені - викликаємо callback з індексом місяця
            onBarClick(firstElement.index);
          } catch (error) {
            // Обробка помилок при роботі з Chart.js API
            // Може виникнути при зміні API Chart.js або проблемах з ініціалізацією графіка
            console.error('Error handling chart click:', error);
            // Не викидаємо помилку далі, щоб не порушити роботу додатку
          }
        },
      }}
      height={220}
    />
  );
};

export default MonthStatsChart; 