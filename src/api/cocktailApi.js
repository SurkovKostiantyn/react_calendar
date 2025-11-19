const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

export async function getCocktailByName(name) {
  const res = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейлі');
  const data = await res.json();
  return data?.drinks || null;
}

export async function getCocktailsByFirstLetter(letter) {
  const res = await fetch(`${API_BASE}/search.php?f=${encodeURIComponent(letter)}`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейлі');
  const data = await res.json();
  return data?.drinks || null;
}

export async function getRandomCocktail() {
  const res = await fetch(`${API_BASE}/random.php`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейль');
  const data = await res.json();
  return data?.drinks?.[0] || null;
}

export async function getCocktailById(id) {
  const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейль');
  const data = await res.json();
  return data?.drinks?.[0] || null;
}

export async function getPopularCocktails() {
  const res = await fetch(`${API_BASE}/filter.php?a=Alcoholic`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейлі');
  const data = await res.json();
  return data?.drinks || null;
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/list.php?c=list`);
  if (!res.ok) throw new Error('Не вдалося завантажити категорії');
  const data = await res.json();
  return data?.drinks || null;
}

export async function getCocktailsByCategory(category) {
  const res = await fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error('Не вдалося завантажити коктейлі');
  const data = await res.json();
  return data?.drinks || null;
} 