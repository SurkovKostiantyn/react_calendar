import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import CelebrationIcon from '@mui/icons-material/Celebration';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import WineBarIcon from '@mui/icons-material/WineBar';
import ChurchIcon from '@mui/icons-material/Church';
import { getUkrainianHolidays } from '../api/holidaysApi';
import { getOnThisDayEvents } from '../api/onThisDayApi';
import { getChurchHolidaysForYear } from '../api/churchHolidays';
import InfoBlock from '../components/InfoBlock';
import LoadingSpinner from '../components/LoadingSpinner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorSnackbar from '../components/ErrorSnackbar';

const Home = () => {
    const { error, errorOpen, setError, handleCloseError } = useErrorHandler();
    const [holidays, setHolidays] = useState([]);
    const [todayHolidays, setTodayHolidays] = useState([]);
    const [onThisDay, setOnThisDay] = useState([]);
    const [churchHolidays, setChurchHolidays] = useState([]);
    const [todayChurchHolidays, setTodayChurchHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(true);
    const [loadingOnThisDay, setLoadingOnThisDay] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            setLoadingHolidays(true);
            try {
                const year = new Date().getFullYear();
                const data = await getUkrainianHolidays(year);
                setHolidays(data);
                const today = new Date().toISOString().slice(0, 10);
                const todayHolidaysArr = data.filter(h => h.date === today);
                setTodayHolidays(todayHolidaysArr);
                const church = getChurchHolidaysForYear(year);
                setChurchHolidays(church);
                setTodayChurchHolidays(church.filter(h => h.date === today));
            } catch (e) {
                console.error("Error fetching holidays:", e);
                setError("Не вдалося завантажити свята. Деякі дані можуть бути недоступні.");
            } finally {
                setLoadingHolidays(false);
            }
        };
        fetchHolidays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLoadingOnThisDay(true);
        getOnThisDayEvents()
            .then((data) => {
                setOnThisDay(data);
                setLoadingOnThisDay(false);
            })
            .catch((e) => {
                console.error("Error fetching on this day events:", e);
                setError("Не вдалося завантажити історичні події. Спробуйте оновити сторінку.");
                setLoadingOnThisDay(false);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Знаходить найближчі події до заданої дати (попередню та наступну)
     * @param {Array} events - масив подій з полем date
     * @param {string} todayStr - дата у форматі YYYY-MM-DD
     * @returns {Object} об'єкт з полями prev (попередня подія) та next (наступна подія)
     */
    function findClosestEvents(events, todayStr) {
        // Якщо немає подій, повертаємо null для обох значень
        if (!events.length) return { prev: null, next: null };
        
        // Конвертуємо рядок дати в Date об'єкт для порівняння
        const today = new Date(todayStr);
        // Встановлюємо час на початок дня для точного порівняння дат
        today.setHours(0, 0, 0, 0);
        
        // Спочатку відсортовуємо події за датою (на випадок, якщо вони не відсортовані)
        const sortedEvents = [...events].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            dateA.setHours(0, 0, 0, 0);
            dateB.setHours(0, 0, 0, 0);
            return dateA.getTime() - dateB.getTime();
        });
        
        let prev = null; // Найближча попередня подія (до сьогодні)
        let next = null; // Найближча наступна подія (після сьогодні)
        
        // Проходимо по відсортованих подіях
        for (const ev of sortedEvents) {
            const eventDate = new Date(ev.date);
            // Встановлюємо час на початок дня для точного порівняння
            eventDate.setHours(0, 0, 0, 0);
            
            // Якщо подія раніше за сьогодні
            if (eventDate < today) {
                // Якщо ще не знайдено попередню подію або поточна подія ближча до сьогодні
                if (!prev || eventDate > new Date(prev.date)) {
                    prev = ev;
                }
            }
            // Якщо подія пізніше за сьогодні
            else if (eventDate > today) {
                // Якщо ще не знайдено наступну подію або поточна подія ближча до сьогодні
                if (!next || eventDate < new Date(next.date)) {
                    next = ev;
                    // Можемо перервати цикл, оскільки події відсортовані
                    break;
                }
            }
            // Якщо eventDate === today, ігноруємо (це сьогоднішня подія)
        }
        
        // Повертаємо знайдені події (можуть бути null, якщо не знайдено)
        return { prev, next };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const closestHoliday = findClosestEvents(holidays, todayStr);
    const closestChurchHoliday = findClosestEvents(churchHolidays, todayStr);

    return (
        <>
            <ErrorSnackbar open={errorOpen} error={error} onClose={handleCloseError} />
            <InfoBlock icon={<WineBarIcon color="primary" sx={{ fontSize: 32 }} />} title="Привіт!" bgcolor="#e3f2fd">
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Це додаток my-alco-calendar — ваш особистий календар для відстеження подій, зустрічей та досягнень. Авторизуйтеся, щоб користуватися всіма можливостями!
                </Typography>
            </InfoBlock>
            <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                Сьогодні є наступні приводи прибухнути:
            </Typography>
            <InfoBlock icon={<CelebrationIcon color="primary" />} title="Державні свята" bgcolor="#e3f2fd">
                {loadingHolidays ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LoadingSpinner />
                    </Box>
                ) : todayHolidays.length > 0 ? (
                    todayHolidays.map(h => (
                        <Box key={h.date + h.localName} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <CelebrationIcon color="primary" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>{h.localName}</Typography>
                                {h.name !== h.localName && <Typography variant="body2" color="text.secondary">{h.name}</Typography>}
                                <Typography variant="caption" color="text.secondary">{h.date}</Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <>
                        <Typography align="center" color="text.secondary" sx={{ mb: 1 }}>Немає подій на сьогодні</Typography>
                        {closestHoliday.prev && <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <CelebrationIcon color="disabled" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body2">Попереднє: {closestHoliday.prev.localName}</Typography>
                                <Typography variant="caption" color="text.secondary">{closestHoliday.prev.date}</Typography>
                            </Box>
                        </Box>}
                        {closestHoliday.next && <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <CelebrationIcon color="disabled" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body2">Наступне: {closestHoliday.next.localName}</Typography>
                                <Typography variant="caption" color="text.secondary">{closestHoliday.next.date}</Typography>
                            </Box>
                        </Box>}
                        {!closestHoliday.prev && !closestHoliday.next && <Typography align="center" color="text.secondary">Немає подій у календарі</Typography>}
                    </>
                )}
            </InfoBlock>
            <InfoBlock icon={<ChurchIcon color="primary" sx={{ fontSize: 32 }} />} title="Церковні свята" bgcolor="#e3f2fd">
                {loadingHolidays ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LoadingSpinner />
                    </Box>
                ) : todayChurchHolidays.length > 0 ? (
                    todayChurchHolidays.map(h => (
                        <Box key={h.date + h.name} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <ChurchIcon color="primary" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>{h.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{h.date}</Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <>
                        <Typography align="center" color="text.secondary" sx={{ mb: 1 }}>Немає подій на сьогодні</Typography>
                        {closestChurchHoliday.prev && <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <ChurchIcon color="disabled" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body2">Попереднє: {closestChurchHoliday.prev.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{closestChurchHoliday.prev.date}</Typography>
                            </Box>
                        </Box>}
                        {closestChurchHoliday.next && <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <ChurchIcon color="disabled" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="body2">Наступне: {closestChurchHoliday.next.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{closestChurchHoliday.next.date}</Typography>
                            </Box>
                        </Box>}
                        {!closestChurchHoliday.prev && !closestChurchHoliday.next && <Typography align="center" color="text.secondary">Немає подій у календарі</Typography>}
                    </>
                )}
            </InfoBlock>
            <InfoBlock icon={<HistoryEduIcon color="primary" />} title="Історичні події" bgcolor="#e3f2fd">
                {loadingOnThisDay ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LoadingSpinner />
                    </Box>
                ) : onThisDay.length > 0 ? (
                    onThisDay.map((h, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
                            <HistoryEduIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body2">{h}</Typography>
                        </Box>
                    ))
                ) : (
                    <Typography align="center" color="text.secondary">Немає подій на сьогодні</Typography>
                )}
            </InfoBlock>

        </>
    );
};

export default Home;
