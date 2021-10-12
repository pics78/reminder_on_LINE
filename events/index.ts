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
                    const data: string = event.postback.data;
                    if (data === 'action=set_remind_datetime') {
                        this.postbackEventHandler.datetimeReturned(event);
                    } else if (data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    } else if (data === 'action=back') {
                        this.postbackEventHandler.backToContentReturned(event);
                    }
                }
                break;
            case StatusDef.modifyContent:
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
            case StatusDef.modifyDatetime:
                if (isPostbackEventForReminder(event)) {
                    const data: string = event.postback.data;
                    if (data === 'action=set_remind_datetime') {
                        this.postbackEventHandler.datetimeReturned(event);
                    } else if (data === 'action=cancel') {
                        this.postbackEventHandler.cancelReturned(event);
                    }
                }
                break;
            default:
                // For now, do nothing.
        }
    }
}