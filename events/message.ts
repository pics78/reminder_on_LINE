import { ReminderEventBase } from './base';
import { LINE_REQUEST_ID_HTTP_HEADER_NAME, MessageAPIResponseBase } from '@line/bot-sdk';
import { ClientConfig } from 'pg';
import {ReminderDBService, LINEService, LINEConfig, StatusMgr, StatusDef, StoreConfig } from '../services';

export declare type MessageEventForReminder = {
    type: 'message';
    message: {
        type: 'text';
        text: string;
    }
} & ReminderEventBase;

export class MessageEventHandler {
    private statusMgr: StatusMgr;
    private db: ReminderDBService;
    private line: LINEService;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.statusMgr = new StatusMgr(storeConfig);
        this.db = new ReminderDBService(dbConfig);
        this.line = new LINEService(lineConfig);
    }

    // リマインダー登録開始処理 -> リマインド内容入力状態へ遷移
    public startRegist = async (event: MessageEventForReminder): Promise<'OK'|'NG'> => {
        let userId: string = event.source.userId;
        let status: string = await this.statusMgr.getStatus(userId);
        // 【ステータス確認】
        // パターン1: 初めて登録する  -> そのユーザに対応するレコードが存在しない場合
        // パターン2: 2回目以降の登録 -> ステータスが`StatusDef.none`になっている場合
        if (status && status !== StatusDef.none) {
            console.error(`unexpected status: ${status}, expected: ${StatusDef.none}`);
            return 'NG';
        }
        return await this.line.replyText(event.replyToken, '登録処理を開始します。\nリマインド内容を送信してください。')
            .then(() => this.statusMgr.setStatus(userId, StatusDef.settingContent));
    }

    // リマインド内容保持 -> リマインド日時選択状態へ遷移
    public contentReturned = async (event: MessageEventForReminder): Promise<'OK'|'NG'> => {
        let userId: string = event.source.userId;
        let status: string = await this.statusMgr.getStatus(userId);
        // 【ステータス確認】
        // パターン1: ステータスが`StatusDef.settingContent`になっている場合
        if (status !== StatusDef.settingContent) {
            console.error(`unexpected status: ${status}, expected: ${StatusDef.settingContent}`);
            return 'NG';
        }
        let content: string = event.message.text;
        return await this.statusMgr.setContent(userId, content)
            .then(() => this.line.replyDatetimePicker(event.replyToken))
            .then(() => this.statusMgr.setStatus(userId, StatusDef.settingDatetime))
            .catch(e => {
                console.error(e);
                return 'NG';
            });
    }

    // 登録したリマインド一覧表示処理
    // どのステータス状態でも可能
    // TODO: 中途半端なステータス状態のときは一覧を返した後、状態を進めるよう促す文言も返したほうが良いかも...?
    public showList = async (event: MessageEventForReminder): Promise<'OK'|'NG'> => {
        let userId: string = event.source.userId;
        return await this.db.selectAll(userId)
            .then(rr => {
                let reply: string = '';
                let n: number = 1;
                if (rr.length > 0) {
                    rr.map(row => {
                        reply += [
                            `(${n})`, '・内容：', row.cnt, '・リマインド時刻：', row.rdt, '\n'
                        ].join('\n');
                        n++;
                    });
                } else {
                    reply = '現在、登録されているリマインドはありません。';
                }
                return this.line.replyText(event.replyToken, reply);
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