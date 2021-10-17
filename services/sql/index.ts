// db table name
export const tn = 'reminders';

// table column name
export const tc = {
    id:  'Id',
    usr: 'line_user',       // LINEユーザID
    cnt: 'content',         // リマインド内容
    rdt: 'remind_datetime', // リマインド日時
    snt: 'sent',            // リマインド送信済フラグ
};

export interface ReminderRow {
    id: string,
    usr: string,
    cnt: string,
    rdt: string,
    snt?: string,
}