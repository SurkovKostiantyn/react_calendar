import React, { useEffect, useState } from "react";
import InfoBlock from '../components/InfoBlock';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, Divider, TextField, Button, Select, MenuItem, InputLabel, FormControl, Pagination } from '@mui/material';
import { getPopularCocktails, getCocktailById, getCocktailByName, getCategories, getCocktailsByCategory, getRandomCocktail } from '../api/cocktailApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorSnackbar from '../components/ErrorSnackbar';

const PAGE_SIZE = 10;

const Cocktails = () => {
  const { error, errorOpen, setError, handleCloseError } = useErrorHandler();
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [random, setRandom] = useState(null);
  const [randomLoading, setRandomLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats ? cats.map(c => c.strCategory) : []);
      } catch (e) {
        console.error("Error fetching categories:", e);
        setError("Не вдалося завантажити категорії. Деякі функції можуть бути недоступні.");
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCocktails = async () => {
      setLoading(true);
      setError(null);
      setRandom(null);
      try {
        let drinks = null;
        if (search) {
          drinks = await getCocktailByName(search);
        } else if (category) {
          drinks = await getCocktailsByCategory(category);
        } else {
          drinks = await getPopularCocktails();
        }
        setTotal(drinks ? drinks.length : 0);
        // Для кожного коктейлю отримуємо повну інфу (інгредієнти, інструкція)
        const details = drinks ? (await Promise.all(
          drinks.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(c => getCocktailById(c.idDrink))
        )).filter(c => c !== null) : [];
        setCocktails(details);
      } catch (e) {
        console.error("Error fetching cocktails:", e);
        setError('Не вдалося завантажити коктейлі. Спробуйте оновити сторінку.');
      }
      setLoading(false);
    };
    fetchCocktails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page]);

  const handleRandom = async () => {
    setRandomLoading(true);
    setRandom(null);
    try {
      const c = await getRandomCocktail();
      if (c) {
        setRandom(c);
      } else {
        setError('Не вдалося отримати випадковий коктейль. Спробуйте ще раз.');
      }
    } catch (e) {
      console.error("Error fetching random cocktail:", e);
      setError('Не вдалося отримати випадковий коктейль. Спробуйте ще раз.');
    }
    setRandomLoading(false);
  };

  return (
    <>
      <ErrorSnackbar open={errorOpen} error={error} onClose={handleCloseError} />
    <InfoBlock icon={<InfoIcon color="primary" sx={{ fontSize: 32 }} />} title="Одиниці виміру в рецептах" bgcolor="#e3f2fd">
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li><b>oz</b> — унція ≈ 30 мл</li>
        <li><b>cl</b> — сантилітр = 10 мл</li>
        <li><b>bottle</b> — пляшка (зазвичай 0.7 л або 1 л)</li>
        <li><b>shot</b> — шот, стопка ≈ 40 мл</li>
        <li><b>pint</b> — пінта ≈ 473 мл (US) або 568 мл (UK)</li>
        <li><b>tsp</b> — чайна ложка ≈ 5 мл</li>
        <li><b>tbsp</b> — столова ложка ≈ 15 мл</li>
        <li><b>dash</b> — кілька крапель (≈ 1 мл)</li>
        <li><b>cup</b> — чашка ≈ 240 мл</li>
        <li><b>part</b> — частина (пропорційно до інших інгредієнтів)</li>
      </ul>
    </InfoBlock>
    <InfoBlock icon={<LocalBarIcon color="primary" sx={{ fontSize: 32 }} />} title="Коктейлі" bgcolor="#e3f2fd">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
        <TextField
          label="Пошук за назвою"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: 1, minWidth: 180 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Категорія</InputLabel>
          <Select
            value={category}
            label="Категорія"
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          >
            <MenuItem value="">Всі</MenuItem>
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      {/*Random coctail*/}
      <Box sx={{ mb: 2 }}> 
        <Button
          variant="outlined"
          onClick={handleRandom}
          disabled={randomLoading}
          sx={{ width: '100%' }}
        >
          {randomLoading ? 'Завантаження...' : 'Випадковий коктейль'}
        </Button>
      </Box>
      {randomLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <LoadingSpinner />
        </Box>
      )}
      {random && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{random.strDrink}</Typography>
          {random.strDrinkThumb && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <img src={random.strDrinkThumb} alt={random.strDrink} style={{ width: 120, borderRadius: 8 }} />
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: 0.5 }} color="text.secondary">Інгредієнти:</Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Array.from({ length: 15 }).map((_, i) => {
              const ing = random[`strIngredient${i+1}`];
              const measure = random[`strMeasure${i+1}`];
              return ing ? <li key={i}><Typography variant="body2">{measure ? measure : ''} {ing}</Typography></li> : null;
            })}
          </ul>
          {random.strInstructions && (
            <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">{random.strInstructions}</Typography>
          )}
        </Box>
      )}
      {/*Coctails list*/}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><LoadingSpinner /></Box>
      ) : (
        <>
          {cocktails.map((c, idx) => (
            <Box key={c.idDrink} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{c.strDrink}</Typography>
              {c.strDrinkThumb && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <img src={c.strDrinkThumb} alt={c.strDrink} style={{ width: 120, borderRadius: 8 }} />
                </Box>
              )}
              <Typography variant="body2" sx={{ mb: 0.5 }} color="text.secondary">Інгредієнти:</Typography>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {Array.from({ length: 15 }).map((_, i) => {
                  const ing = c[`strIngredient${i+1}`];
                  const measure = c[`strMeasure${i+1}`];
                  return ing ? <li key={i}><Typography variant="body2">{measure ? measure : ''} {ing}</Typography></li> : null;
                })}
              </ul>
              {c.strInstructions && (
                <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">{c.strInstructions}</Typography>
              )}
              {idx < cocktails.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
          {total > PAGE_SIZE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(total / PAGE_SIZE)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </InfoBlock>
    </>
  );
};

export default Cocktails; 