import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const pageTitles = {
    '/calendar': 'Календар - my-alco-calendar',
    '/cabinet': 'Кабінет - my-alco-calendar',
    '/achievements': 'Досягнення - my-alco-calendar',
    '/cocktails': 'Коктейлі - my-alco-calendar',
    '/alcomarkets': 'Алкомаркети - my-alco-calendar',
    '/games': 'Ігри - my-alco-calendar',
    '/games/testgame': 'Test Game - my-alco-calendar',
};

const PageTitle = () => {
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        let title = pageTitles[location.pathname];
        
        // Для головної сторінки визначаємо title залежно від авторизації
        if (!title) {
            if (location.pathname === '/') {
                title = user ? 'Головна - my-alco-calendar' : 'Вхід - my-alco-calendar';
            } else {
                title = 'my-alco-calendar';
            }
        }
        
        document.title = title;
    }, [location.pathname, user]);

    return null;
};

export default PageTitle;

