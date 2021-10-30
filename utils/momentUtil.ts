import moment, { Moment } from 'moment';

moment.locale('ja');

module.exports = {
    getRemindMomentJustBefore: (m: Moment): Moment => {
        let diff: number = m.minutes() % 5;
        return m.add(-diff, 'minutes');
    },
    getRemindMomentJustAfter: (m: Moment): Moment => {
        let diff: number = 5 - (m.minutes() % 5);
        return m.add(diff, 'minutes');
    },
    // DB登録用文字列への変換
    formatted: (m: Moment): string => {
        return m.format('YYYY-MM-DDtHH:mm');
    },
    // 表示用文字列への変換
    getDisplayString: (dt: Moment|string): string => {
        const format: string = 'YYYY年MM月DD日(ddd)HH時mm分';
        return typeof dt === 'string' ?
            /* string arg */ moment(new Date(dt)).format(format) :
            /* moment arg */ moment(dt).format(format);
    },
}