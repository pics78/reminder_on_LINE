import moment from 'moment';

// LINEユーザIDとリマインド番号からDBのIDを生成する
export const getId = (userId: string): string => {
    const dateStr: string = moment().format().replace(/[^\d]/g, '');
    return Buffer.from(`${userId}${dateStr}`).toString('base64');
}