import moment, { Moment } from 'moment';

export const getRemindMomentJustBefore = (m: Moment): Moment => {
    let diff: number = m.minutes() % 10;
    return m.add(-diff, 'minutes');
}

export const getRemindMomentJustAfter = (m: Moment): Moment => {
    let diff: number = 10 - (m.minutes() % 10);
    return m.add(diff, 'minutes');
}

// DB登録用文字列への変換
export const formatted = (m: Moment): string => {
    return m.format('YYYY-MM-DDtHH:mm');
}

// 表示用文字列への変換
export const getDisplayString = (dt: string|Moment): string => {
    moment.locale("ja");
    return moment(dt).format('YYYY年MM月DD日(ddd)HH時mm分');
}