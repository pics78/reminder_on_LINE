import { ClientConfig } from 'pg';
import { LINEConfig } from '../services/lineConnectService';
import { StoreConfig } from '../services/statusService';
import { MessageEventForReminder, MessageEventHandler } from './message';
import { PostbackEventForReminder, PostbackEventHandler } from './postback';

export declare type WebhookEventForReminder =
    MessageEventForReminder | PostbackEventForReminder;

export class EventHandler {
    private messageEventHandler: MessageEventHandler;
    private postbackEventHandler: PostbackEventHandler;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.messageEventHandler = new MessageEventHandler(storeConfig, dbConfig, lineConfig);
        this.postbackEventHandler = new PostbackEventHandler(storeConfig, dbConfig, lineConfig);
    }

    public handle = async (event: WebhookEventForReminder) => {
        if (event.type == 'message' && event.message.type == 'text') {
            const msg: string = event.message.text;
            // リマインダー登録フロー開始 -> リマインド内容入力以降
            if (msg == 'set reminder') {
                this.messageEventHandler.startRegist(event);
            // リマインダー一覧表示処理
            } else if (msg == 'list') {
                this.messageEventHandler.showList(event);
            // リマインド内容取得処理 -> 日時選択以降
            } else {
                this.messageEventHandler.contentReturned(event);
            }
        } else if (event.type == 'postback' && event.postback.data == 'action=set_remind_datetime') {
            const token: string = event.replyToken;
            // リマインド日時取得 -> リマインド登録処理
            this.postbackEventHandler.datetimeReturned(event);
        }
    }
}