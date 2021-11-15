import moment, { Moment } from 'moment';

moment.locale('ja');

const getMoment = (arg?: Moment|string): Moment => {
    return arg ?
    /* input time base */   typeof arg === 'string' ? moment(arg) : arg :
    /* current time base */ moment();
}

export class RemindDt {
    private constructor(){}

    static prev = (arg?: Moment|string): Moment => {
        const m: Moment = getMoment(arg);
        let diff: number = m.minutes() % 5;
        return m.add(-diff, 'minutes');
    }
    static next = (arg?: Moment|string): Moment => {
        const m: Moment = getMoment(arg);
        let diff: number = 5 - (m.minutes() % 5);
        return m.add(diff, 'minutes');
    }
}

export class PrintDt {
    private constructor(){}

    static toDB = (m: Moment): string => {
        return m.format('YYYY-MM-DDtHH:mm');
    }
    static toDisplay = (dt: Moment|string): string => {
        const format: string = 'YYYY年MM月DD日(ddd)HH時mm分';
        return typeof dt === 'string' ?
            /* string arg */ moment(new Date(dt)).format(format) :
            /* moment arg */ moment(dt).format(format);
    }
}