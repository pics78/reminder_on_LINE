import { MessageEventForReminder } from './def/types';
import { LINE_REQUEST_ID_HTTP_HEADER_NAME, FlexBubble } from '@line/bot-sdk';
import { ClientConfig } from 'pg';
import { LINEService, LINEConfig } from '../services/lineConnectService';
import { bubbleForList, bubbleToConfirmContent } from '../services/lineFlexMessagesDef';
import { ReminderDBService } from '../services/dbConnectService';
import { getDisplayString } from '../utils/momentUtil';
import { StatusMgr, StatusDef, StoreConfig } from '../services/statusService';
import { ReminderErrorHandler, ErrorType } from './error';

export class MessageEventHandler {
    private statusMgr: StatusMgr;
    private db: ReminderDBService;
    private line: LINEService;
    private errHandler: ReminderErrorHandler;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.statusMgr = new StatusMgr(storeConfig);
        this.db = new ReminderDBService(dbConfig);
        this.line = new LINEService(lineConfig);
        this.errHandler = new ReminderErrorHandler(lineConfig);
    }

    // リマインダー登録開始処理 -> リマインド内容入力状態へ遷移
    public startRegist = async (event: MessageEventForReminder): Promise<Boolean> => {
        let status: string|null = await this.statusMgr.getStatus(event.source.userId);
        // 【ステータス確認】
        // パターン1: 初めて登録する  -> そのユーザに対応するレコードが存在しない場合
        // パターン2: 2回目以降の登録 -> ステータスが`StatusDef.none`になっている場合
        if (status && status !== StatusDef.none) {
            this.errHandler.handleError(ErrorType.unexpectedStatus, event.replyToken, event.source.userId, status, StatusDef.none);
            return false;
        }
        return await this.line.replyText(
            event.replyToken, '登録処理を開始します。\nリマインド内容を送信してください。', [ false, true ])
            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.settingContent));
    }

    // リマインド内容保持 -> リマインド日時選択状態へ遷移
    public contentReturned = async (event: MessageEventForReminder): Promise<Boolean> => {
        let status: string = await this.statusMgr.getStatus(event.source.userId)
            .then(s => s != null ? s : 'null');
        // 【ステータス確認】
        // パターン1: ステータスが`StatusDef.settingContent`になっている場合
        if (status !== StatusDef.settingContent) {
            this.errHandler.handleError(ErrorType.unexpectedStatus, event.replyToken, event.source.userId, status, StatusDef.settingContent);
            return false;
        }
        let content: string = event.message.text;
        return await this.statusMgr.setContent(event.source.userId, content)
            .then(() => this.line.replyDatetimePicker(event.replyToken, [true, true]))
            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.settingDatetime))
            .catch(e => {
                console.error(e);
                return false;
            });
    }

    public newContentReturned = async (event: MessageEventForReminder): Promise<Boolean> => {
        let newContent: string = event.message.text;
        let oldContent: string = await this.statusMgr.getContent(event.source.userId);
        return await this.line.replyFlexBubbleMessage(
            event.replyToken, bubbleToConfirmContent(oldContent, newContent))
            .then(() => this.statusMgr.setContent(event.source.userId, newContent))
            .then(() => this.statusMgr.setStatus(event.source.userId, StatusDef.confirmContent));
    }

    public showList = async (event: MessageEventForReminder): Promise<'OK'|'NG'> => {
        return await this.db.selectAll(event.source.userId)
            .then(rr => {
                let bubbles: FlexBubble[] = [];
                let n: number = 1;
                if (rr.length > 0) {
                    rr.map(row => {
                        bubbles.push(bubbleForList(n, row.id, row.cnt, getDisplayString(row.rdt)));
                        n++;
                    });
                    return this.line.replyFlexCarouselMessages(event.replyToken, bubbles);
                } else {
                    return this.line.replyText(event.replyToken, '現在、登録されているリマインドはありません。');
                }
            })
            .then(r => {
                if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                    return 'OK';
                } else {
                    return 'NG';
                }
            })
            .catch(e => {
                console.log(e);
                return 'NG';
            });
    }

}