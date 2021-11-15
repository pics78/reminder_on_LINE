import { ReplyableEvent, User } from '@line/bot-sdk';

export type ReminderEventBase = {
    // For now, target is user only.
    source: User
} & ReplyableEvent;