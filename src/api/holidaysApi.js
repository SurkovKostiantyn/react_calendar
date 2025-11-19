export async function getUkrainianHolidays(year) {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/UA`);
  if (!res.ok) throw new Error('Не вдалося завантажити свята');
  return await res.json();
} 