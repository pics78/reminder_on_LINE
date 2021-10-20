import { ClientConfig } from 'pg';
import { LINEConfig } from '../services/lineConnectService';
import { StatusMgr, Status, StatusDef, StoreConfig } from '../services/statusService';
import { MessageEventHandler } from './message';
import { PostbackEventHandler } from './postback';
import { SchedulerHandler } from './scheduler';
import { WebhookEventForReminder, isMessageEventForReminder, isPostbackEventForReminder } from './def/types';

export class EventHandler {
    private messageEventHandler: MessageEventHandler;
    private postbackEventHandler: PostbackEventHandler;
    private schedulerHandler: SchedulerHandler;
    private statusMgr: StatusMgr;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.messageEventHandler = new MessageEventHandler(storeConfig, dbConfig, lineConfig);
        this.postbackEventHandler = new PostbackEventHandler(storeConfig, dbConfig, lineConfig);
        this.schedulerHandler = new SchedulerHandler(dbConfig, lineConfig);
        this.statusMgr = new StatusMgr(storeConfig);
    }

    // ステータスの確認と更新, 処理の分配
    public handle = async (event: WebhookEventForReminder) => {
        const status: Status|null = await this.statusMgr.getStatus(event.source.userId);

        switch (status) {
            case StatusDef.none || null:
                if (isMessageEventForReminder(event)) {
                    if (event.message.text === 'set reminder') {
                        this.messageEventHandler.startRegist(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.settingContent));
                    } else if (event.message.text === 'list') {
                        this.messageEventHandler.showList(event);
                            // No status change
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data.match(/^action=modify&id=.*$/)) {
                        this.postbackEventHandler.modifyReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.modify))
                    } else if (event.postback.data.match(/^action=delete&id=.*$/)) {
                        this.postbackEventHandler.deleteReturned(event);
                            // No status change
                    }
                }
                break;
            case StatusDef.settingContent:
                if (isMessageEventForReminder(event)) {
                    if (!event.message.text.match(/^\$.*/)) {
                        this.messageEventHandler.contentReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.settingDatetime));
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    }
                }
                break;
            case StatusDef.settingDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=set_remind_datetime') {
                        this.postbackEventHandler.datetimeReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    } else if (event.postback.data === 'action=back') {
                        this.postbackEventHandler.backToContentReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.settingContent));
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    }
                }
                break;
            case StatusDef.modify:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=modify_content') {
                        this.postbackEventHandler.modifyContentReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.modifyContent));
                    } else if (event.postback.data === 'action=modify_datetime') {
                        this.postbackEventHandler.modifyDatetimeReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.modifyDatetime));
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    }
                }
                break;
            case StatusDef.modifyContent:
                if (isMessageEventForReminder(event)) {
                    if (!event.message.text.match(/^\$.*/)) {
                        this.messageEventHandler.newContentReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.confirmContent));
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    }
                }
                break;
            case StatusDef.modifyDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=modify_remind_datetime') {
                        this.postbackEventHandler.newDatetimeReturned(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.confirmDatetime));
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    }
                }
                break;
            case StatusDef.confirmContent:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=confirm_content') {
                        this.postbackEventHandler.confirmContentReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    } else if (event.postback.data === 'action=retry_content') {
                        this.postbackEventHandler.retryContent(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.modifyContent));
                    }
                }
                break;
            case StatusDef.confirmDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=confirm_datetime') {
                        this.postbackEventHandler.confirmDatetimeReturned(event)
                            .then(() => this.statusMgr.reset(event.source.userId));
                    } else if (event.postback.data === 'action=retry_datetime') {
                        this.postbackEventHandler.retryDatetime(event)
                            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.modifyDatetime));
                    }
                }
                break;
            default:
                // For now, do nothing.
                // status error
        }
    }

    public remind = async () => {
        this.schedulerHandler.run();
    }
}