const LIMA_TIME_ZONE = 'America/Lima';

function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: LIMA_TIME_ZONE, ...options })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

export function limaDate(date = new Date()): string {
  const p = parts(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

export function limaTime(date = new Date()): string {
  const p = parts(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });
  return `${p.hour}:${p.minute}:${p.second}`;
}
