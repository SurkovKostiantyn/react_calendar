export async function getOnThisDayEvents() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const url = `https://byabbe.se/on-this-day/${month}/${day}/events.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не вдалося завантажити події On This Day');
  const data = await res.json();
  // Повертаємо масив коротких описів подій
  return (data.events || []).map(ev => ev.description);
}