export const SQL_CONST = {
    table: 'reminders',
    column: {
        id:  'Id',
        usr: 'line_user',       // LINEユーザID
        cnt: 'content',         // リマインド内容
        rdt: 'remind_datetime', // リマインド日時
        snt: 'sent',            // リマインド送信済フラグ
        cdt: 'created_at',      // リマインダ作成日時
    },
}