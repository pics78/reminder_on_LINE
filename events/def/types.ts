import { ReminderEventBase } from './base';

export type MessageEventForReminder = {
    type: 'message';
    message: {
        type: 'text';
        text: string;
    }
} & ReminderEventBase;

export type PostbackEventForReminder = {
    type: 'postback';
    postback: {
        data: string;
        params: {
            datetime: string;
        }
    }
} & ReminderEventBase;

export type WebhookEventForReminder =
    MessageEventForReminder | PostbackEventForReminder;

export const isMessageEventForReminder = (event: WebhookEventForReminder):
    event is MessageEventForReminder => event.type === 'message';

export const isPostbackEventForReminder = (event: WebhookEventForReminder):
    event is PostbackEventForReminder => event.type === 'postback';

export const EventMsg = {
    startRegist: 'set reminder',
    showList: 'list',
    modifyRemind: 'modify',
    modifyContent: 'modify content',
    modifyDatetime: 'modify datetime',
}

export const EventPostbackData = {
    datetimeReturned: 'action=set_remind_datetime',
}