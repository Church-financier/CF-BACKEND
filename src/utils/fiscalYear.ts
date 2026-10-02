export function fiscalYearOf(date: Date | string, startMonth: number): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return month < startMonth ? year - 1 : year;
}

export function fiscalMonthOf(date: Date | string, startMonth: number): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const calendarMonth = d.getMonth() + 1;
  let fiscalMonth = calendarMonth - (startMonth - 1);
  if (fiscalMonth <= 0) fiscalMonth += 12;
  return fiscalMonth;
}

export function fiscalYearStart(date: Date | string, startMonth: number): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getMonth() + 1 < startMonth ? d.getFullYear() - 1 : d.getFullYear();
  return new Date(year, startMonth - 1, 1, 0, 0, 0, 0);
}

export function fiscalYearEnd(date: Date | string, startMonth: number): Date {
  const start = fiscalYearStart(date, startMonth);
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return end;
}

export function fiscalYearRange(date: Date | string, startMonth: number): { fiscalYear: number; start: Date; end: Date } {
  const start = fiscalYearStart(date, startMonth);
  const end = fiscalYearEnd(date, startMonth);
  return { fiscalYear: fiscalYearOf(date, startMonth), start, end };
}
