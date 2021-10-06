import { Moment } from 'moment';

export const getRemindMomentJustBefore = (m: Moment): Moment => {
    let diff: number = m.minutes() % 5;
    return m.add(-diff, 'minutes');
}

export const getRemindMomentJustAfter = (m: Moment): Moment => {
    let diff: number = 5 - (m.minutes() % 5);
    return m.add(diff, 'minutes');
}

export const formatted = (m: Moment): string => {
    return m.format('YYYY-MM-DDtHH:mm');
}