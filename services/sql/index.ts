// db table name
export const tn = 'reminders';

// table column name
export const tc = {
    id:  'Id',
    usr: 'line_user',       // LINEユーザID
    cnt: 'content',         // リマインド内容
    rdt: 'remind_datetime', // リマインド日時
};

export interface ReminderRow {
    id: number,
    usr: string,
    cnt: string,
    rdt: string,
}

export interface QueryString {
    select_list?: string,
    insert?: string,
    update?: string,
    delete?: string,
}