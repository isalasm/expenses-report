import { subMonths, addMonths, setDate, isAfter, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns';

export function getCurrentFacturationPeriod(facturationStartDay: number, referenceDate: Date = new Date()) {
    const currentDay = referenceDate.getDate();

    let startPeriod: Date;
    let endPeriod: Date;

    if (currentDay >= facturationStartDay) {
        // We are past the start day in the current month
        startPeriod = setDate(referenceDate, facturationStartDay);
        endPeriod = setDate(addMonths(referenceDate, 1), facturationStartDay - 1);
    } else {
        // We haven't reached the start day in the current month yet, so we are still in last month's cycle
        startPeriod = setDate(subMonths(referenceDate, 1), facturationStartDay);
        endPeriod = setDate(referenceDate, facturationStartDay - 1);
    }

    return {
        start: startOfDay(startPeriod),
        end: endOfDay(endPeriod)
    };
}

export function isDateInPeriod(dateString: string, start: Date, end: Date): boolean {
    if (!dateString) return false;
    const target = new Date(dateString);

    return (isAfter(target, start) || isEqual(target, start)) &&
        (isBefore(target, end) || isEqual(target, end));
}
