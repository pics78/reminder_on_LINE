import { ReplyableEvent, User } from '@line/bot-sdk';

export declare type ReminderEventBase = {
    // For now, target is user only.
    source: User
} & ReplyableEvent;