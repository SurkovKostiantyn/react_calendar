import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import LoadingSpinner from '../components/LoadingSpinner';
import Typography from '@mui/material/Typography';
import '../styles/Calendar.css';
import InfoBlock from '../components/InfoBlock';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { Checkbox, FormControlLabel, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorSnackbar from '../components/ErrorSnackbar';
import { validateEvent, validateDrinksUpdate } from '../utils/eventValidation';

const popularDrinks = [
  { key: 'beer', label: 'Пиво' },
  { key: 'wine', label: 'Вино' },
  { key: 'vodka', label: 'Горілка' },
  { key: 'whiskey', label: 'Віскі' },
  { key: 'rum', label: 'Ром' },
  { key: 'gin', label: 'Джин' },
  { key: 'cognac', label: 'Коньяк' },
  { key: 'tequila', label: 'Текіла' },
  { key: 'cider', label: 'Сидр' },
  { key: 'nalivka', label: 'Наливка' },
  { key: 'nastoyanka', label: 'Настоянка' },
  { key: 'cocktail', label: 'Коктейль' },
  { key: 'champagne', label: 'Шампанське' },
  { key: 'other', label: 'Інше' },
];

const Calendar = () => {
  const { user } = useAuth();
  const { error, errorOpen, setError, handleCloseError } = useErrorHandler();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [drinkEventId, setDrinkEventId] = useState(null);
  const [savingDrinks, setSavingDrinks] = useState(false);
  // Map для зберігання таймерів для кожної комірки (ключ - dateStr)
  const clickTimersRef = useRef(new Map());
  // Map для зберігання таймерів анімацій для кожної комірки (ключ - dateStr, значення - масив таймерів)
  const animationTimersRef = useRef(new Map());
  const processingDatesRef = useRef(new Set()); // Блокування для запобігання race condition

  // Cleanup: очищаємо всі таймери при unmount компонента
  useEffect(() => {
    // Копіюємо ref в змінну для використання в cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const timersMap = clickTimersRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const animationTimersMap = animationTimersRef.current;
    return () => {
      // Очищаємо всі таймери з Map
      timersMap.forEach((timer) => {
        clearTimeout(timer);
      });
      timersMap.clear();
      // Очищаємо всі таймери анімацій
      animationTimersMap.forEach((timers) => {
        if (Array.isArray(timers)) {
          timers.forEach((timer) => {
            clearTimeout(timer);
          });
        } else {
          clearTimeout(timers);
        }
      });
      animationTimersMap.clear();
    };
  }, []);

  // Завантаження подій
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "events"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({
          id: d.id,
          title: "",
          start: d.data().start,
          allDay: true,
        }));
        setEvents(fetched);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Не вдалося завантажити події. Спробуйте оновити сторінку.");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      setLoading(true);
      fetchEvents();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Single click: перегляд або створення події
  const handleDateClick = async (dateStr) => {
    if (!user) return;
    // Перевірка на race condition: якщо дата вже обробляється, виходимо
    if (processingDatesRef.current.has(dateStr)) {
      return;
    }
    // Додаємо дату до Set оброблюваних дат
    processingDatesRef.current.add(dateStr);
    try {
      const q = query(
        collection(db, "events"),
        where("start", "==", dateStr),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      setSelectedDate(dateStr);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        const data = snap.docs[0].data();
        setDrinkEventId(docId);
        setSelectedDrinks(data.drinks || []);
      } else {
        const newEvent = {
          title: "",
          start: dateStr,
          userId: user.uid,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          drinks: [],
        };
        // Валідація події перед записом
        const validation = validateEvent(newEvent, user.uid);
        if (!validation.isValid) {
          console.error("Event validation failed:", validation.errors);
          setError(`Помилка валідації: ${validation.errors.join(', ')}`);
          return;
        }
        const docRef = await addDoc(collection(db, "events"), newEvent);
        setEvents(prev => [...prev, { id: docRef.id, ...newEvent }]);
        setDrinkEventId(docRef.id);
        setSelectedDrinks([]);
      }
    } catch (error) {
      console.error("handleDateClick error:", error);
      setError("Не вдалося відкрити подію. Спробуйте ще раз.");
    } finally {
      // Видаляємо дату з Set після завершення операції
      processingDatesRef.current.delete(dateStr);
    }
  };

  // Double click: видалення події
  const handleDateDoubleClick = async (dateStr) => {
    if (!user) return;
    // Перевірка на race condition: якщо дата вже обробляється, виходимо
    if (processingDatesRef.current.has(dateStr)) {
      return;
    }
    // Додаємо дату до Set оброблюваних дат
    processingDatesRef.current.add(dateStr);
    try {
      const q = query(
        collection(db, "events"),
        where("start", "==", dateStr),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        await deleteDoc(doc(db, "events", docId));
        setEvents(prev => prev.filter(ev => ev.id !== docId));
        if (selectedDate === dateStr) {
          setSelectedDate(null);
          setDrinkEventId(null);
          setSelectedDrinks([]);
        }
      }
    } catch (error) {
      console.error("handleDateDoubleClick error:", error);
      setError("Не вдалося видалити подію. Спробуйте ще раз.");
    } finally {
      // Видаляємо дату з Set після завершення операції
      processingDatesRef.current.delete(dateStr);
    }
  };

  // Обробник click vs dblclick через dayCellDidMount
  const handleCellMount = (cell) => {
    const date = cell.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Очищаємо попередній таймер для цієї комірки, якщо він існує
    const existingTimer = clickTimersRef.current.get(dateStr);
    if (existingTimer) {
      clearTimeout(existingTimer);
      clickTimersRef.current.delete(dateStr);
    }
    
    // Очищаємо попередні таймери анімацій для цієї комірки, якщо вони існують
    const existingAnimationTimers = animationTimersRef.current.get(dateStr);
    if (existingAnimationTimers) {
      if (Array.isArray(existingAnimationTimers)) {
        existingAnimationTimers.forEach((timer) => {
          clearTimeout(timer);
        });
      } else {
        clearTimeout(existingAnimationTimers);
      }
      animationTimersRef.current.delete(dateStr);
    }
    
    cell.el.onclick = (e) => {
      const currentTimer = clickTimersRef.current.get(dateStr);
      if (currentTimer) {
        clearTimeout(currentTimer);
        clickTimersRef.current.delete(dateStr);
        // Даблклік
        cell.el.classList.add('animated-remove');
        const removeTimer = setTimeout(() => {
          cell.el.classList.remove('animated-remove');
          // Видаляємо таймер з Map після виконання
          const timers = animationTimersRef.current.get(dateStr);
          if (Array.isArray(timers)) {
            const index = timers.indexOf(removeTimer);
            if (index > -1) timers.splice(index, 1);
            if (timers.length === 0) {
              animationTimersRef.current.delete(dateStr);
            }
          }
        }, 400);
        // Зберігаємо таймер анімації
        const existingAnimTimers = animationTimersRef.current.get(dateStr) || [];
        animationTimersRef.current.set(dateStr, Array.isArray(existingAnimTimers) ? [...existingAnimTimers, removeTimer] : [removeTimer]);
        handleDateDoubleClick(dateStr);
      } else {
        // Одиночний клік — без затримки
        cell.el.classList.add('animated-press');
        const pressTimer = setTimeout(() => {
          cell.el.classList.remove('animated-press');
          // Видаляємо таймер з Map після виконання
          const timers = animationTimersRef.current.get(dateStr);
          if (Array.isArray(timers)) {
            const index = timers.indexOf(pressTimer);
            if (index > -1) timers.splice(index, 1);
            if (timers.length === 0) {
              animationTimersRef.current.delete(dateStr);
            }
          }
        }, 200);
        // Зберігаємо таймер анімації
        const existingAnimTimers = animationTimersRef.current.get(dateStr) || [];
        animationTimersRef.current.set(dateStr, Array.isArray(existingAnimTimers) ? [...existingAnimTimers, pressTimer] : [pressTimer]);
        handleDateClick(dateStr);
        const newTimer = setTimeout(() => {
          clickTimersRef.current.delete(dateStr);
        }, 300);
        clickTimersRef.current.set(dateStr, newTimer);
      }
    };
  };

  // Клік по іконці бокалу
  const handleEventClick = async (info) => {
    if (!user) return;
    const dateStr = info.event.startStr;
    setSelectedDate(dateStr);
    try {
      const q = query(
        collection(db, "events"),
        where("start", "==", dateStr),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        const data = snap.docs[0].data();
        setDrinkEventId(docId);
        setSelectedDrinks(data.drinks || []);
      }
    } catch (error) {
      console.error("handleEventClick error:", error);
      setError("Не вдалося завантажити дані події. Спробуйте ще раз.");
    }
  };

  // Рендер бокалу
  const renderEventContent = () => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.height = "100%";
    container.style.width = "100%";
    container.style.pointerEvents = "none";
    
    // Використовуємо SVG безпосередньо без React root для уникнення витоку пам'яті
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "#222222");
    svg.style.display = "block";
    
    // SVG path для WineBarIcon (Material Icons)
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M6 3v6c0 2.97 2.16 5.43 5 5.91V19H8v2h8v-2h-3v-4.09c2.84-.48 5-2.94 5-5.91V3H6zm6 10c-1.86 0-3.41-1.28-3.86-3h7.72c-.45 1.72-2 3-3.86 3zm4-8H8V5h8v0z");
    svg.appendChild(path);
    
    container.appendChild(svg);
    return { domNodes: [container] };
  };

  const handleSaveDrinks = async () => {
    if (!drinkEventId) return;
    setSavingDrinks(true);
    try {
      // Валідація drinks перед оновленням
      const validation = validateDrinksUpdate(selectedDrinks);
      if (!validation.isValid) {
        console.error("Drinks validation failed:", validation.errors);
        setError(`Помилка валідації: ${validation.errors.join(', ')}`);
        setSavingDrinks(false);
        return;
      }
      await updateDoc(doc(db, "events", drinkEventId), { drinks: selectedDrinks });
    } catch (error) {
      console.error("handleSaveDrinks error:", error);
      setError("Не вдалося зберегти дані. Спробуйте ще раз.");
    }
    setSavingDrinks(false);
  };

  return (
    <>
      <ErrorSnackbar open={errorOpen} error={error} onClose={handleCloseError} />
      <InfoBlock icon={<CalendarMonthIcon color="primary" sx={{ fontSize: 32 }} />} title="Календар" bgcolor="#e3f2fd">
        {loading ? (
          <LoadingSpinner />
        ) : user ? (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventClassNames={() => 'no-bg-event'}
            height="auto"
            dayCellDidMount={handleCellMount}
          />
        ) : (
          <Typography align="center" sx={{ mt: 2 }}>
            Please log in to access the calendar.
          </Typography>
        )}
      </InfoBlock>

      {selectedDate && (
        <InfoBlock icon={<LocalBarIcon color="primary" sx={{ fontSize: 32 }} />} title={`Що пили ${selectedDate}`} bgcolor="#e3f2fd">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {popularDrinks.map(drink => (
              <FormControlLabel
                key={drink.key}
                control={
                  <Checkbox
                    checked={selectedDrinks.includes(drink.key)}
                    onChange={e => {
                      if (e.target.checked) setSelectedDrinks(prev => [...prev, drink.key]);
                      else setSelectedDrinks(prev => prev.filter(d => d !== drink.key));
                    }}
                  />
                }
                label={<span>{drink.label}</span>}
              />
            ))}
          </Box>
          <Button variant="contained" onClick={handleSaveDrinks} disabled={savingDrinks}>
            {savingDrinks ? 'Збереження...' : 'Зберегти'}
          </Button>
        </InfoBlock>
      )}
    </>
  );
};

export default Calendar;
