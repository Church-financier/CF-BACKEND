"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fiscalYearOf = fiscalYearOf;
exports.fiscalMonthOf = fiscalMonthOf;
exports.fiscalYearStart = fiscalYearStart;
exports.fiscalYearEnd = fiscalYearEnd;
exports.fiscalYearRange = fiscalYearRange;
function fiscalYearOf(date, startMonth) {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return month < startMonth ? year - 1 : year;
}
function fiscalMonthOf(date, startMonth) {
    const d = typeof date === "string" ? new Date(date) : date;
    const calendarMonth = d.getMonth() + 1;
    let fiscalMonth = calendarMonth - (startMonth - 1);
    if (fiscalMonth <= 0)
        fiscalMonth += 12;
    return fiscalMonth;
}
function fiscalYearStart(date, startMonth) {
    const d = typeof date === "string" ? new Date(date) : date;
    const year = d.getMonth() + 1 < startMonth ? d.getFullYear() - 1 : d.getFullYear();
    return new Date(year, startMonth - 1, 1, 0, 0, 0, 0);
}
function fiscalYearEnd(date, startMonth) {
    const start = fiscalYearStart(date, startMonth);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 1);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return end;
}
function fiscalYearRange(date, startMonth) {
    const start = fiscalYearStart(date, startMonth);
    const end = fiscalYearEnd(date, startMonth);
    return { fiscalYear: fiscalYearOf(date, startMonth), start, end };
}
//# sourceMappingURL=fiscalYear.js.map