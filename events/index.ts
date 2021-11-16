import { MessageEventHandler, PostbackEventHandler, SchedulerHandler } from './types';
import { WebhookEventForReminder, isMessageEventForReminder, isPostbackEventForReminder } from './def/types';
import { LINEConnector } from '../connectors';
import { StatusMgr, Status, StatusDef } from '../services';
import { MessageBuilder } from '../utils/lineMessageBuilder';

const statusMgr = new StatusMgr();
const line = new LINEConnector();
const builder = new MessageBuilder();

export class EventHandler {
    private constructor() {}

    // ステータスの確認と更新, 処理の分配
    static handle = async (event: WebhookEventForReminder) => {
        const status: Status|null = await statusMgr.getStatus(event.source.userId);

        try {
            switch (status) {
                case StatusDef.none || null:
                    if (isMessageEventForReminder(event)) {
                        if (event.message.text === 'set reminder') {
                            MessageEventHandler.startRegist(event)
                                .then(isOk => {
                                    if (isOk) statusMgr.setStatus(event.source.userId, StatusDef.settingContent);
                                });
                        } else if (event.message.text === 'list') {
                            MessageEventHandler.showList(event);
                                // No status change
                        }
                    } else if (isPostbackEventForReminder(event)) {
                        if (event.postback.data.match(/^action=modify&id=.*$/)) {
                            PostbackEventHandler.modifyReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.modify));
                        } else if (event.postback.data.match(/^action=delete&id=.*$/)) {
                            PostbackEventHandler.deleteReturned(event);
                                // No status change
                        }
                    }
                    break;
                case StatusDef.settingContent:
                    if (isMessageEventForReminder(event)) {
                        if (!event.message.text.match(/^\$.*/)) {
                            MessageEventHandler.contentReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.settingDatetime));
                        }
                    } else if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.settingDatetime:
                    if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=set_remind_datetime') {
                            PostbackEventHandler.datetimeReturned(event)
                                .then(isOk => {
                                    if (isOk) statusMgr.reset(event.source.userId);
                                });
                        } else if (event.postback.data === 'action=back') {
                            PostbackEventHandler.backToContentReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.settingContent));
                        } else if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.modify:
                    if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=modify_content') {
                            PostbackEventHandler.modifyContentReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.modifyContent));
                        } else if (event.postback.data === 'action=modify_datetime') {
                            PostbackEventHandler.modifyDatetimeReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.modifyDatetime));
                        } else if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.modifyContent:
                    if (isMessageEventForReminder(event)) {
                        if (!event.message.text.match(/^\$.*/)) {
                            MessageEventHandler.newContentReturned(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.confirmContent));
                        }
                    } else if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.modifyDatetime:
                    if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=modify_remind_datetime') {
                            PostbackEventHandler.newDatetimeReturned(event)
                                .then(isOk => {
                                    if (isOk) statusMgr.setStatus(event.source.userId, StatusDef.confirmDatetime);
                                });
                        } else if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.confirmContent:
                    if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=confirm_content') {
                            PostbackEventHandler.confirmContentReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        } else if (event.postback.data === 'action=retry_content') {
                            PostbackEventHandler.retryContent(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.modifyContent));
                        } else if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                case StatusDef.confirmDatetime:
                    if (isPostbackEventForReminder(event)) {
                        if (event.postback.data === 'action=confirm_datetime') {
                            PostbackEventHandler.confirmDatetimeReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        } else if (event.postback.data === 'action=retry_datetime') {
                            PostbackEventHandler.retryDatetime(event)
                                .then(() => statusMgr.setStatus(event.source.userId, StatusDef.modifyDatetime));
                        } else if (event.postback.data === 'action=cancel') {
                            PostbackEventHandler.cancelReturned(event)
                                .then(() => statusMgr.reset(event.source.userId));
                        }
                    }
                    break;
                default:
                    // status error
                    await line.replyMessage(event.replyToken, builder.type('text')
                        .text('システム内部で不整合が発生しました。入力状態をリセットします。')
                        .build()
                    )
                    .then(() => statusMgr.reset(event.source.userId));
                    
                    await line.sendToAdmin( `[ERROR]: ${event.source.userId}, ステータスエラー`);
            }
        } catch (err: unknown) {
            const userId: string = event.source.userId;
            await line.replyMessage(event.replyToken, builder.type('text')
                .text('予期せぬエラーが発生しました。入力状態をリセットします。')
                .build()
            )
            .then(() => statusMgr.reset(event.source.userId));
            
            await line.sendToAdmin(`[ERROR]: ${event.source.userId}, ${err}`);
        }
    }

    static remind = async (): Promise<string> => {
        return SchedulerHandler.run();
    }
}