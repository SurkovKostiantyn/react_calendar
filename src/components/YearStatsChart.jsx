import React from 'react';
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

const YearStatsChart = ({ data }) => (
  <Bar
    data={{
      labels: data.map(d => d.year),
      datasets: [
        {
          label: 'Днів з алкоголем',
          data: data.map(d => d.count),
          backgroundColor: '#1976d2',
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
    }}
    height={220}
  />
);

export default YearStatsChart; 