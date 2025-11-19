import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Box, Typography, Grid, Chip, LinearProgress } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoBlock from '../components/InfoBlock';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorSnackbar from '../components/ErrorSnackbar';
import LoadingSpinner from '../components/LoadingSpinner';

const totalDaysSteps = [10, 20, 50, 100, 150, 200, 250, 300, 365];
const streakSteps = [3, 5, 10, 15, 20];
const fridaysSteps = [2, 5, 10, 20];
const mondaysSteps = [2, 5, 10, 20];

const Achievements = () => {
  const { user } = useAuth();
  const { error, errorOpen, setError, handleCloseError } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, "events"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          start: doc.data().start,
        }));
        setStats(calcStats(fetchedEvents));
      } catch (e) {
        console.error("Error fetching events:", e);
        setStats(null);
        setError("Не вдалося завантажити досягнення. Спробуйте оновити сторінку.");
      }
      setLoading(false);
    };
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function calcStats(events) {
    // Edge case: порожній масив подій
    if (!events || !Array.isArray(events) || !events.length) return null;
    
    // Загальна кількість днів
    const daysSet = new Set();
    const byWeekday = Array(7).fill(0);
    const byMonth = Array(12).fill(0);
    const byDate = {};
    events.forEach(ev => {
      // Edge case: перевірка наявності поля start
      if (!ev || !ev.start) {
        console.warn('Event missing start field:', ev);
        return;
      }
      const d = new Date(ev.start);
      // Edge case: перевірка валідності дати
      if (isNaN(d.getTime())) {
        console.warn('Invalid date in event:', ev.start);
        return;
      }
      const key = d.toISOString().slice(0, 10);
      daysSet.add(key);
      const weekday = d.getDay();
      const month = d.getMonth();
      // Edge case: перевірка валідності індексів
      if (weekday >= 0 && weekday < 7) {
        byWeekday[weekday]++;
      }
      if (month >= 0 && month < 12) {
        byMonth[month]++;
      }
      byDate[key] = true;
    });
    // Edge case: перевірка на порожній Set
    if (daysSet.size === 0) return null;
    
    // Обчислення найдовшої серії днів підряд
    // Конвертуємо всі унікальні дати в Date об'єкти та сортуємо їх за зростанням
    const allDates = Array.from(daysSet)
      .map(dateStr => {
        const date = new Date(dateStr);
        // Edge case: перевірка валідності дати після конвертації
        if (isNaN(date.getTime())) {
          console.warn('Invalid date after conversion:', dateStr);
          return null;
        }
        return date;
      })
      .filter(date => date !== null) // Видаляємо невалідні дати
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Edge case: якщо після фільтрації не залишилося валідних дат
    if (allDates.length === 0) return null;
    
    let maxStreak = 0; // Найдовша знайдена серія
    let curStreak = 0; // Поточна серія днів підряд
    
    // Проходимо по всіх відсортованих датах
    allDates.forEach((currentDate, index) => {
      if (index === 0) {
        // Перша дата - починаємо серію з 1 дня
        curStreak = 1;
      } else {
        // Обчислюємо різницю в днях між поточною та попередньою датою
        const prevDate = allDates[index - 1];
        // Конвертуємо мілісекунди в дні (86400000 мс = 1 день)
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);
        
        if (diffDays === 1) {
          // Якщо різниця рівно 1 день - продовжуємо поточну серію
          curStreak++;
        } else {
          // Якщо різниця більше 1 дня - серія перервалася
          // Зберігаємо максимальну серію перед початком нової
          maxStreak = Math.max(maxStreak, curStreak);
          // Починаємо нову серію з поточної дати
          curStreak = 1;
        }
      }
    });
    
    // Перевіряємо останню серію (вона може бути найдовшою)
    maxStreak = Math.max(maxStreak, curStreak);
    
    // Підрахунок п'ятниць та понеділків
    // allDates тепер містить Date об'єкти, тому використовуємо getDay() безпосередньо
    const fridays = allDates.filter(date => date.getDay() === 5).length;
    const mondays = allDates.filter(date => date.getDay() === 1).length;
    // Перевірка чи є повний тиждень (7 днів підряд)
    let fullWeek = false;
    if (allDates.length >= 7) {
      // Перевіряємо всі можливі послідовності з 7 днів
      for (let i = 0; i < allDates.length - 6; i++) {
        // Беремо 7 послідовних дат
        const week = allDates.slice(i, i + 7);
        let isFull = true;
        // Перевіряємо, чи кожна наступна дата відрізняється рівно на 1 день
        for (let j = 1; j < 7; j++) {
          const diffDays = Math.round((week[j].getTime() - week[j - 1].getTime()) / 86400000);
          if (diffDays !== 1) {
            isFull = false;
            break;
          }
        }
        if (isFull) { 
          fullWeek = true; 
          break; 
        }
      }
    }
    // Перевірка чи є повний місяць (всі дні місяця заповнені)
    // Знаходимо всі унікальні роки з подій
    const yearsSet = new Set();
    allDates.forEach(date => {
      yearsSet.add(date.getFullYear());
    });
    
    let fullMonth = false;
    // Перевіряємо кожен рік та кожен місяць цього року
    for (const year of yearsSet) {
      // Перевіряємо всі 12 місяців для поточного року
      for (let m = 0; m < 12; m++) {
        // Обчислюємо кількість днів у місяці для конкретного року
        // new Date(year, month + 1, 0) повертає останній день місяця
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        let count = 0;
        
        // Перевіряємо кожен день місяця
        for (let d = 1; d <= daysInMonth; d++) {
          // Формуємо ключ у форматі YYYY-MM-DD
          const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (byDate[key]) count++;
        }
        
        // Якщо всі дні місяця заповнені - досягнення отримано
        if (count === daysInMonth) {
          fullMonth = true;
          break; // Виходимо з циклу місяців
        }
      }
      
      // Якщо знайшли повний місяць, виходимо з циклу років
      if (fullMonth) break;
    }
    return {
      total: daysSet.size,
      maxStreak,
      fridays,
      mondays,
      byWeekday,
      byMonth,
      fullWeek,
      fullMonth
    };
  }

  if (!user) {
    return (
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Typography variant="h6">Будь ласка, увійдіть до системи.</Typography>
      </Box>
    );
  }

  // Підрахунок кількості досягнень
  const totalAchievements = totalDaysSteps.length + streakSteps.length + fridaysSteps.length + mondaysSteps.length + 2; // +2 за тиждень і місяць
  let achieved = 0;
  if (stats) {
    achieved += totalDaysSteps.filter(step => stats.total >= step).length;
    achieved += streakSteps.filter(step => stats.maxStreak >= step).length;
    achieved += fridaysSteps.filter(step => stats.fridays >= step).length;
    achieved += mondaysSteps.filter(step => stats.mondays >= step).length;
    if (stats.fullWeek) achieved++;
    if (stats.fullMonth) achieved++;
  }

  return (
    <>
      <ErrorSnackbar open={errorOpen} error={error} onClose={handleCloseError} />
    <InfoBlock icon={<EmojiEventsIcon color="primary" sx={{ fontSize: 32 }} />} title="Досягнення" bgcolor="#e3f2fd">
      <Box sx={{ mb: 3 }}>
        <Typography align="center" sx={{ mb: 1 }}>
          Досягнення: {achieved} / {totalAchievements}
        </Typography>
        <LinearProgress variant="determinate" value={100 * achieved / totalAchievements} sx={{ height: 12, borderRadius: 6 }} />
      </Box>
      {loading || !stats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><LoadingSpinner /></Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1 }}>Загальна кількість днів з алкоголем</Typography>
            {totalDaysSteps.map(step => (
              <Chip
                key={step}
                icon={<EmojiEventsIcon color={stats.total >= step ? "primary" : "disabled"} />}
                label={` ${step} днів`}
                color={stats.total >= step ? "primary" : "default"}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1 }}>Найдовша серія днів підряд</Typography>
            {streakSteps.map(step => (
              <Chip
                key={step}
                icon={<EmojiEventsIcon color={stats.maxStreak >= step ? "primary" : "disabled"} />}
                label={` ${step} днів`}
                color={stats.maxStreak >= step ? "primary" : "default"}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>П'яних п'ятниць</Typography>
            {fridaysSteps.map(step => (
              <Chip
                key={step}
                icon={<EmojiEventsIcon color={stats.fridays >= step ? "primary" : "disabled"} />}
                label={` ${step} разів`}
                color={stats.fridays >= step ? "primary" : "default"}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>П'яних понеділків</Typography>
            {mondaysSteps.map(step => (
              <Chip
                key={step}
                icon={<EmojiEventsIcon color={stats.mondays >= step ? "primary" : "disabled"} />}
                label={` ${step} разів`}
                color={stats.mondays >= step ? "primary" : "default"}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>Весь тиждень п'яний</Typography>
            <Chip
              icon={<EmojiEventsIcon color={stats.fullWeek ? "primary" : "disabled"} />}
              label={stats.fullWeek ? "Досягнуто!" : "Ще ні"}
              color={stats.fullWeek ? "primary" : "default"}
              sx={{ mr: 1, mb: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>Весь місяць п'яний</Typography>
            <Chip
              icon={<EmojiEventsIcon color={stats.fullMonth ? "primary" : "disabled"} />}
              label={stats.fullMonth ? "Досягнуто!" : "Ще ні"}
              color={stats.fullMonth ? "primary" : "default"}
              sx={{ mr: 1, mb: 1 }}
            />
          </Grid>
        </Grid>
      )}
    </InfoBlock>
    </>
  );
};

export default Achievements; 