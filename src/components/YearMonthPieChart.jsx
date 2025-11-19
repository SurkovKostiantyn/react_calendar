import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Typography } from '@mui/material';
ChartJS.register(ArcElement, Tooltip, Legend);

const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

const YearMonthPieChart = ({ byMonth, year, onMonthSelect, selectedMonth }) => {
  // Функція для перевірки високосного року
  const isLeapYear = (y) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
  // Функція для обчислення кількості днів у році
  const getDaysInYear = (y) => isLeapYear(y) ? 366 : 365;
  
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const maxMonth = isCurrentYear ? now.getMonth() : 11;
  
  // Обчислюємо загальну кількість днів з алкоголем у місяцях від початку року до поточного місяця включно
  const totalDrank = byMonth.slice(0, maxMonth + 1).reduce((a, b) => a + b, 0);
  
  // Обчислюємо загальну кількість днів у році (або до сьогодні для поточного року)
  let totalDays;
  if (isCurrentYear) {
    // Для поточного року обчислюємо кількість днів від початку року до сьогодні
    // Використовуємо UTC дати для уникнення проблем з часовими поясами
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    // Обчислюємо різницю в мілісекундах та конвертуємо в дні
    // Використовуємо Math.round для точної перевірки (враховує можливі проблеми з округленням)
    const diffMs = todayUTC.getTime() - startOfYear.getTime();
    totalDays = Math.round(diffMs / 86400000) + 1; // +1 бо включаємо сьогоднішній день
  } else {
    // Для минулих років використовуємо повну кількість днів у році
    totalDays = getDaysInYear(year);
  }
  
  // Обчислюємо кількість тверезих днів
  // Перевіряємо, щоб totalDrank не перевищував totalDays (це може вказувати на помилку в даних)
  const totalSober = Math.max(0, totalDays - totalDrank);
  
  // Додаткова перевірка: якщо totalDrank > totalDays, це вказує на проблему в даних
  // У такому випадку логуємо попередження, але все одно використовуємо Math.max(0, ...) для безпеки
  if (totalDrank > totalDays) {
    console.warn(`YearMonthPieChart: totalDrank (${totalDrank}) exceeds totalDays (${totalDays}) for year ${year}. This may indicate a data inconsistency.`);
  }

  // Для pie chart по місяцю
  let monthPie = null;
  if (selectedMonth !== null && 
      typeof selectedMonth === 'number' && 
      selectedMonth >= 0 && 
      selectedMonth <= 11 && 
      Array.isArray(byMonth) && 
      selectedMonth < byMonth.length) {
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const drank = byMonth[selectedMonth] || 0; // Забезпечуємо, що drank не є undefined
    // Обчислюємо кількість тверезих днів у місяці
    // Використовуємо Math.max(0, ...) для запобігання негативним значенням
    const soberInMonth = Math.max(0, daysInMonth - drank);
    
    // Додаткова перевірка: якщо drank > daysInMonth, це вказує на проблему в даних
    if (drank > daysInMonth) {
      console.warn(`YearMonthPieChart: drank (${drank}) exceeds daysInMonth (${daysInMonth}) for ${monthNames[selectedMonth]} ${year}. This may indicate a data inconsistency.`);
    }
    
    monthPie = {
      labels: [
        `Днів з алкоголем у ${monthNames[selectedMonth]}`,
        `Тверезих днів у ${monthNames[selectedMonth]}`
      ],
      data: [drank, soberInMonth]
    };
  }

  return (
    <div>
      <Pie
        data={{
          labels: [
            `Днів з алкоголем у ${year}`,
            `Тверезих днів у ${year}`
          ],
          datasets: [
            {
              data: [totalDrank, totalSober],
              backgroundColor: ["#8e24aa", "#e0e0e0"],
              borderWidth: 1,
            },
          ],
        }}
        options={{
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: `Відношення днів з алкоголем/без у ${year}` },
          },
          onClick: () => { if (onMonthSelect) onMonthSelect(null); },
        }}
        height={180}
      />
      <Typography sx={{ mt: 3, mb: 1, textAlign: 'center', fontWeight: 500 }}>
        Натисніть на місяць у графіку, щоб побачити pie chart цього місяця
      </Typography>
      {selectedMonth !== null && monthPie && (
        <Pie
          data={{
            labels: monthPie.labels,
            datasets: [
              {
                data: monthPie.data,
                backgroundColor: ["#8e24aa", "#e0e0e0"],
                borderWidth: 1,
              },
            ],
          }}
          options={{
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: `Відношення днів з алкоголем/без у ${monthNames[selectedMonth]} ${year}` },
            },
          }}
          height={180}
        />
      )}

    </div>
  );
};

export default YearMonthPieChart; 