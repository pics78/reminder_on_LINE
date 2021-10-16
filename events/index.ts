import { ClientConfig } from 'pg';
import { LINEConfig } from '../services/lineConnectService';
import { StatusMgr, Status, StatusDef, StoreConfig } from '../services/statusService';
import { MessageEventHandler } from './message';
import { PostbackEventHandler } from './postback';
import { WebhookEventForReminder, isMessageEventForReminder, isPostbackEventForReminder } from './def/types';

export class EventHandler {
    private messageEventHandler: MessageEventHandler;
    private postbackEventHandler: PostbackEventHandler;
    private statusMgr: StatusMgr;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.messageEventHandler = new MessageEventHandler(storeConfig, dbConfig, lineConfig);
        this.postbackEventHandler = new PostbackEventHandler(storeConfig, dbConfig, lineConfig);
        this.statusMgr = new StatusMgr(storeConfig);
    }

    public handle = async (event: WebhookEventForReminder) => {
        const status: Status|null = await this.statusMgr.getStatus(event.source.userId);

        switch (status) {
            case StatusDef.none || null:
                if (isMessageEventForReminder(event)) {
                    const msg: string = event.message.text;
                    if (msg === 'set reminder') {
                        this.messageEventHandler.startRegist(event);
                    } else if (msg === 'list') {
                        this.messageEventHandler.showList(event);
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data.match(/^action=modify&id=.*$/)) {
                        this.postbackEventHandler.modifyReturned(event);
                    } else if (event.postback.data.match(/^action=delete&id=.*$/)) {
                        this.postbackEventHandler.deleteReturned(event);
                    }
                }
                break;
            case StatusDef.settingContent:
                if (isMessageEventForReminder(event)) {
                    if (!event.message.text.match(/^\$.*/)) {
                        this.messageEventHandler.contentReturned(event);
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    }
                }
                break;
            case StatusDef.settingDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=set_remind_datetime') {
                        this.postbackEventHandler.datetimeReturned(event);
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    } else if (event.postback.data === 'action=back') {
                        this.postbackEventHandler.backToContentReturned(event);
                    }
                }
                break;
            case StatusDef.modify:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=modify_content') {
                        this.postbackEventHandler.modifyContentReturned(event);
                    } else if (event.postback.data === 'action=modify_datetime') {
                        this.postbackEventHandler.modifyDatetimeReturned(event);
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    }
                }
                break;
            case StatusDef.modifyContent:
                if (isMessageEventForReminder(event)) {
                    if (!event.message.text.match(/^\$.*/)) {
                        this.messageEventHandler.newContentReturned(event);
                    }
                } else if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    }
                }
                break;
            case StatusDef.modifyDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=modify_remind_datetime') {
                        this.postbackEventHandler.newDatetimeReturned(event);
                    } else if (event.postback.data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    }
                }
                break;
            case StatusDef.confirmContent:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=confirm_content') {
                        this.postbackEventHandler.confirmContentReturned(event);
                    } else if (event.postback.data === 'action=retry_content') {
                    }
                }
                break;
            case StatusDef.confirmDatetime:
                if (isPostbackEventForReminder(event)) {
                    if (event.postback.data === 'action=confirm_datetime') {
                        this.postbackEventHandler.confirmDatetimeReturned(event);
                    } else if (event.postback.data === 'action=retry_datetime') {
                    }
                    break;
                }
            default:
                // For now, do nothing.
        }
    }
}