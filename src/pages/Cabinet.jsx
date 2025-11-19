import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Tooltip,
    Chip,
    InputAdornment,
    TextField,
    Divider
} from "@mui/material";
import { useAuth } from '../contexts/AuthContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorSnackbar from '../components/ErrorSnackbar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { collection, getDocs, query, where } from "firebase/firestore";
import MonthStatsChart from '../components/MonthStatsChart';
import YearMonthPieChart from '../components/YearMonthPieChart';
import YearStatsChart from '../components/YearStatsChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Legend
} from 'chart.js';
import InfoBlock from '../components/InfoBlock';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LoadingSpinner from '../components/LoadingSpinner';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Legend);

const CopyableField = ({ value, label, copied, onCopy }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AssignmentIndIcon sx={{ mr: 1 }} />
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {label}: {value}
        </Typography>
        <Tooltip title={copied ? "Скопійовано!" : `Скопіювати ${label}` }>
            <IconButton size="small" onClick={() => onCopy(value)}>
                <ContentCopyIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    </Box>
);

const Cabinet = () => {
    const { user } = useAuth();
    const { error, errorOpen, setError, handleCloseError } = useErrorHandler();
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsYear, setStatsYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [gameWins, setGameWins] = useState(0);
    const [gameLosses, setGameLosses] = useState(0);
    const [gameStatsByType, setGameStatsByType] = useState({});
    const [loadingGameStats, setLoadingGameStats] = useState(true);
    const copiedTimerRef = useRef(null);

    // Cleanup: очищаємо таймер copied при unmount компонента
    useEffect(() => {
        return () => {
            if (copiedTimerRef.current) {
                clearTimeout(copiedTimerRef.current);
                copiedTimerRef.current = null;
            }
        };
    }, []);

    // Завантаження статистики ігор
    useEffect(() => {
        if (!user) return;

        const loadGameStats = async () => {
            setLoadingGameStats(true);
            try {
                const finishedGamesRef = collection(db, 'finished_games');
                const querySnapshot = await getDocs(finishedGamesRef);
                const games = querySnapshot.docs.map(doc => doc.data());
                
                // Групуємо статистику по типах ігор
                const statsByGameType = {};
                
                games.forEach(game => {
                    if (game.participants && Array.isArray(game.participants) && game.participants.includes(user.uid)) {
                        const gameType = game.gameType || 'testgame';
                        if (!statsByGameType[gameType]) {
                            statsByGameType[gameType] = { wins: 0, losses: 0 };
                        }
                        
                        if (game.winner && game.winner.userId === user.uid) {
                            statsByGameType[gameType].wins++;
                        } else {
                            statsByGameType[gameType].losses++;
                        }
                    }
                });
                
                // Підраховуємо загальну статистику (для сумісності з існуючим кодом)
                let totalWins = 0;
                let totalLosses = 0;
                Object.values(statsByGameType).forEach(stats => {
                    totalWins += stats.wins;
                    totalLosses += stats.losses;
                });
                
                setGameWins(totalWins);
                setGameLosses(totalLosses);
                setGameStatsByType(statsByGameType);
            } catch (error) {
                console.error("Error loading game stats:", error);
            } finally {
                setLoadingGameStats(false);
            }
        };

        loadGameStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            setLoadingStats(true);
            try {
                const q = query(
                    collection(db, "events"),
                    where("userId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    start: doc.data().start,
                }));
                setAllEvents(fetchedEvents);
                setStats(calcStats(fetchedEvents, statsYear));
            } catch (e) {
                console.error("Error fetching events:", e);
                setStats(null);
                setError("Не вдалося завантажити статистику. Спробуйте оновити сторінку.");
            }
            setLoadingStats(false);
        };
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, statsYear]);

    function calcStats(events, year) {
        // Edge case: порожній масив подій
        if (!events || !Array.isArray(events) || !events.length) return null;
        
        // Edge case: невалідний рік
        if (typeof year !== 'number' || isNaN(year) || year < 1900 || year > 2100) {
            console.warn(`Invalid year: ${year}, using current year`);
            year = new Date().getFullYear();
        }
        
        const now = new Date();
        const thisYear = year;
        const isCurrentYear = now.getFullYear() === year;
        const thisMonth = isCurrentYear ? now.getMonth() : 11;
        
        // Обчислення кількості днів у році
        // Для минулих років використовуємо функцію перевірки високосного року
        const isLeapYear = (y) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
        const getDaysInYear = (y) => isLeapYear(y) ? 366 : 365;
        
        let daysInYear;
        if (isCurrentYear) {
            // Для поточного року обчислюємо кількість днів від початку року до сьогодні
            // Використовуємо UTC дати для уникнення проблем з часовими поясами
            const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
            const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
            // Обчислюємо різницю в мілісекундах та конвертуємо в дні
            // Використовуємо Math.round для точної перевірки (враховує можливі проблеми з округленням)
            const diffMs = todayUTC.getTime() - startOfYear.getTime();
            daysInYear = Math.max(1, Math.round(diffMs / 86400000) + 1); // +1 бо включаємо сьогоднішній день, мінімум 1
        } else {
            // Для минулих років використовуємо повну кількість днів у році
            daysInYear = getDaysInYear(year);
        }
        const byMonth = Array(12).fill(0);
        const byWeekday = Array(7).fill(0);
        let yearCount = 0;
        let monthCount = 0;
        const drankDaysSet = new Set();
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
            if (d.getFullYear() === thisYear) {
                yearCount++;
                const month = d.getMonth();
                const weekday = d.getDay();
                // Edge case: перевірка валідності індексів
                if (month >= 0 && month < 12) {
                    byMonth[month]++;
                    if (month === thisMonth) monthCount++;
                }
                if (weekday >= 0 && weekday < 7) {
                    byWeekday[weekday]++;
                }
                // Обчислюємо день року (1-based, тобто 1 січня = 1, 31 грудня = 365/366)
                // Використовуємо UTC дати для уникнення проблем з часовими поясами
                const startOfYearUTC = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
                const eventDateUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
                // Обчислюємо різницю в мілісекундах та конвертуємо в дні
                const diffMs = eventDateUTC.getTime() - startOfYearUTC.getTime();
                const dayOfYear = Math.round(diffMs / 86400000) + 1; // +1 бо день року починається з 1
                // Edge case: перевірка валідності дня року
                if (dayOfYear > 0 && dayOfYear <= daysInYear) {
                    drankDaysSet.add(dayOfYear);
                }
            }
        });
        // Масив: 1 — пив, 0 — не пив (тільки до поточного дня для поточного року)
        const drankArr = Array(daysInYear).fill(0);
        drankDaysSet.forEach(idx => { if (idx > 0 && idx <= daysInYear) drankArr[idx - 1] = 1; });
        // Пошук найдовших серій
        let maxDrink = 0, maxSober = 0, curDrink = 0, curSober = 0;
        for (let i = 0; i < drankArr.length; i++) {
            if (drankArr[i] === 1) {
                curDrink++;
                maxDrink = Math.max(maxDrink, curDrink);
                curSober = 0;
            } else {
                curSober++;
                maxSober = Math.max(maxSober, curSober);
                curDrink = 0;
            }
        }
        const monthsToConsider = byMonth.slice(0, thisMonth + 1);
        // Edge case: перевірка на порожній масив
        let maxMonth = -1;
        if (monthsToConsider.length > 0) {
            // Знаходимо максимальне значення серед місяців
            const maxMonthValue = Math.max(...monthsToConsider);
            // Перевіряємо, чи є хоча б один місяць зі значенням > 0
            // Якщо всі місяці мають 0, то maxMonth буде -1 (немає даних)
            if (!isNaN(maxMonthValue) && maxMonthValue > 0) {
                maxMonth = monthsToConsider.indexOf(maxMonthValue);
            }
        }
        
        // Знаходимо мінімальне значення серед місяців (тільки серед тих, що > 0)
        let minMonth = -1;
        let minValue = Infinity;
        for (let i = 0; i < monthsToConsider.length; i++) {
            if (monthsToConsider[i] > 0 && monthsToConsider[i] < minValue) {
                minValue = monthsToConsider[i];
                minMonth = i;
            }
        }
        // Якщо всі місяці мають 0, minMonth залишиться -1 (це обробляється в UI)
        
        // Знаходимо максимальне та мінімальне значення серед днів тижня
        // Edge case: перевірка на порожній масив
        let maxWeekday = -1;
        let minWeekday = -1;
        if (byWeekday.length > 0) {
            const maxWeekdayValue = Math.max(...byWeekday);
            const minWeekdayValue = Math.min(...byWeekday);
            // Перевіряємо, чи є дані (хоча б один день має значення > 0)
            // Якщо всі дні мають 0, то повертаємо -1
            if (!isNaN(maxWeekdayValue) && maxWeekdayValue > 0) {
                maxWeekday = byWeekday.indexOf(maxWeekdayValue);
            }
            if (!isNaN(minWeekdayValue) && minWeekdayValue > 0) {
                minWeekday = byWeekday.indexOf(minWeekdayValue);
            }
        }
        return {
            yearCount,
            monthCount,
            maxMonth,
            minMonth,
            maxWeekday,
            minWeekday,
            byMonth,
            byWeekday,
            maxDrink,
            maxSober
        };
    }

    function getYearStats(events) {
        const map = new Map();
        events.forEach(ev => {
            const d = new Date(ev.start);
            const y = d.getFullYear();
            map.set(y, (map.get(y) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));
    }

    if (!user) {
        return (
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                <Typography variant="h6">Будь ласка, увійдіть до системи.</Typography>
            </Box>
        );
    }

    const meta = user.metadata || {};

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // Очищаємо попередній таймер, якщо він існує
        if (copiedTimerRef.current) {
            clearTimeout(copiedTimerRef.current);
        }
        setCopied(true);
        copiedTimerRef.current = setTimeout(() => {
            setCopied(false);
            copiedTimerRef.current = null;
        }, 1200);
    };

    return (
        <>
            <ErrorSnackbar open={errorOpen} error={error} onClose={handleCloseError} />
            <InfoBlock icon={<PersonIcon color="primary" sx={{ fontSize: 32 }} />} title="Профіль алкоголіка" bgcolor="#e3f2fd">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={user.photoURL || undefined}
                        alt={user.displayName || user.email || 'User'}
                        sx={{ width: 90, height: 90, mb: 1, fontSize: 40, boxShadow: 3 }}
                    >
                        {!user.photoURL && <PersonIcon fontSize="inherit" />}
                    </Avatar>
                    {user.displayName && (
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{user.displayName}</Typography>
                    )}
                    <CopyableField value={user.uid} label="UID" copied={copied} onCopy={handleCopy} />
                    <Chip icon={<EmailIcon />} label={user.email} color="default" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    {user.phoneNumber && (
                        <Chip icon={<PhoneIphoneIcon />} label={user.phoneNumber} color="primary" variant="outlined" sx={{ mb: 1 }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                                Створено: {meta.creationTime ? new Date(meta.creationTime).toLocaleString() : '-'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                                Останній вхід: {meta.lastSignInTime ? new Date(meta.lastSignInTime).toLocaleString() : '-'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </InfoBlock>
            {!loadingGameStats && (gameWins > 0 || gameLosses > 0) && (
                <InfoBlock icon={<SportsEsportsIcon color="primary" sx={{ fontSize: 32 }} />} title="Статистика ігор" bgcolor="#e3f2fd">
                    {Object.keys(gameStatsByType).length > 0 ? (
                        Object.entries(gameStatsByType).map(([gameType, stats]) => {
                            const gameName = gameType === 'testgame' ? '21' : gameType;
                            return (
                                <Box key={gameType} sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                                        Гра "{gameName}"
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, py: 2 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Перемог
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                {stats.wins}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Програшів
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                {stats.losses}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Всього ігор
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                {stats.wins + stats.losses}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {Object.keys(gameStatsByType).indexOf(gameType) < Object.keys(gameStatsByType).length - 1 && (
                                        <Divider sx={{ mt: 2 }} />
                                    )}
                                </Box>
                            );
                        })
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, py: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Перемог
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    {gameWins}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Програшів
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                                    {gameLosses}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    Всього ігор
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {gameWins + gameLosses}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </InfoBlock>
            )}
            {loadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <LoadingSpinner />
                </Box>
            ) : stats && (
                <InfoBlock icon={<BarChartIcon color="primary" sx={{ fontSize: 32 }} />} title="Статистика" bgcolor="#e3f2fd">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 1 }}>
                        <TextField
                            type="number"
                            value={statsYear}
                            onChange={e => setStatsYear(Number(e.target.value))}
                            size="small"
                            inputProps={{ min: 2000, max: new Date().getFullYear(), style: { width: 60, textAlign: 'center', fontWeight: 700, fontSize: 16 } }}
                            sx={{ mx: 1, '& input': { fontSize: { xs: 16, sm: 18, md: 20 }, p: 0.5 } }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">рік</InputAdornment>,
                            }}
                        />
                    </Box>
                    {stats.yearCount === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary" variant="h6">немає даних</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {[
                                {
                                    icon: <BarChartIcon color="primary" sx={{ fontSize: 32 }} />,
                                    value: stats.yearCount,
                                    label: "Днів з алкоголем цього року"
                                },
                                {
                                    icon: <BarChartIcon color="secondary" sx={{ fontSize: 32 }} />,
                                    value: stats.monthCount,
                                    label: "Днів цього місяця"
                                },
                                {
                                    icon: <EmojiEventsIcon color="primary" sx={{ fontSize: 32 }} />,
                                    value: stats.maxDrink,
                                    label: "Найдовша алкогольна серія"
                                },
                                {
                                    icon: <EmojiEventsIcon color="action" sx={{ fontSize: 32 }} />,
                                    value: stats.maxSober,
                                    label: "Найдовша твереза серія"
                                },
                                {
                                    icon: <EmojiEventsIcon color="success" sx={{ fontSize: 32 }} />,
                                    value: stats.maxMonth === -1 ? 'немає' : ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"][stats.maxMonth],
                                    label: "Місяць з найбільшою кількістю"
                                },
                                {
                                    icon: <SentimentVeryDissatisfiedIcon color="action" sx={{ fontSize: 32 }} />,
                                    value: stats.minMonth === -1 ? 'немає' : ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"][stats.minMonth],
                                    label: "Місяць з найменшою кількістю"
                                },
                                {
                                    icon: <EmojiEventsIcon color="success" sx={{ fontSize: 32 }} />,
                                    value: stats.maxWeekday === -1 ? 'немає' : ["Неділя","Понеділок","Вівторок","Середа","Четвер","Пʼятниця","Субота"][stats.maxWeekday],
                                    label: "День тижня з найбільшою кількістю"
                                },
                                {
                                    icon: <SentimentVeryDissatisfiedIcon color="action" sx={{ fontSize: 32 }} />,
                                    value: stats.minWeekday === -1 ? 'немає' : ["Неділя","Понеділок","Вівторок","Середа","Четвер","Пʼятниця","Субота"][stats.minWeekday],
                                    label: "День тижня з найменшою кількістю"
                                },
                            ].map((item, idx, arr) => (
                                <React.Fragment key={idx}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                                        {item.icon}
                                        <Typography variant="body" sx={{ fontWeight: 500, mx: 2, minWidth: 55 }}>{item.value}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                    </Box>
                                    {idx < arr.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </Box>
                    )}
                </InfoBlock>
            )}
            {!loadingStats && stats && stats.yearCount > 0 && (
                <InfoBlock icon={<ShowChartIcon color="primary" sx={{ fontSize: 32 }} />} title="Графіки" bgcolor="#e3f2fd">
                    <Typography variant="h6" align="center" sx={{ mb: 2, mt: 4 }}>Річна статистика</Typography>
                    <YearMonthPieChart byMonth={stats.byMonth} year={statsYear} onMonthSelect={setSelectedMonth} selectedMonth={selectedMonth} />
                    <Typography variant="h6" align="center" sx={{ mb: 2, mt: 4 }}>Динаміка по місяцях</Typography>
                    <MonthStatsChart byMonth={stats.byMonth} year={statsYear} onBarClick={setSelectedMonth} />
                    <Typography variant="h6" align="center" sx={{ mb: 2, mt: 4 }}>Динаміка по рокам</Typography>
                    <YearStatsChart data={getYearStats(allEvents)} />
                </InfoBlock>
            )}
        </>
    );
};

export default Cabinet; 