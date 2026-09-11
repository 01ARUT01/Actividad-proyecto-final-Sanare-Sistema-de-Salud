export function formatDate(date: Date | string, locale: string): string {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatTime(date: string | Date, locale: string): string {
  return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

// Días de la semana en orden domingo-primero (coincide con Date.getDay()).
// timeZone: 'UTC' evita que el día se corra en husos negativos (ej. GMT-5).
export function weekdays(locale: string, style: 'narrow' | 'short' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
  const base = Date.UTC(2024, 0, 7); // 7 de enero de 2024 = domingo
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(base + i * 86400000)));
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}