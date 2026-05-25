export const parseCustomDate = (dateStr: string, isEndDate: boolean): string => {
  const trimmed = dateStr.trim();
  if (!trimmed) return '';
  
  if (/^\d{4}$/.test(trimmed)) {
    if (isEndDate) {
      return `${trimmed}-12-28T23:59:59`;
    }
    return `${trimmed}-01-01T00:00:00`;
  }

  const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = trimmed.match(datePattern);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}T00:00:00`;
  }

  return trimmed;
};