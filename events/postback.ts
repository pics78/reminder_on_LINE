import { PostbackEventForReminder, WebhookEventForReminder } from './def/types';
import { LINE_REQUEST_ID_HTTP_HEADER_NAME } from '@line/bot-sdk';
import { ClientConfig } from 'pg';
import { LINEService, LINEConfig } from '../services/lineConnectService';
import { ReminderDBService } from '../services/dbConnectService';
import { StatusMgr, StatusDef, Status, StoreConfig } from '../services/statusService';
import moment, { Moment } from 'moment';
import { getRemindMomentJustAfter, getRemindMomentJustBefore, formatted } from '../utils/momentUtil'
import { ReminderErrorHandler, ErrorType } from './error';

export class PostbackEventHandler {
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

    public datetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        // リマインド日時取得 -> リマインド登録処理
        let token: string = event.replyToken;
        let userId: string = event.source.userId;
        let selectedMoment: Moment = getRemindMomentJustBefore(moment(event.postback.params.datetime));
        let nextRemindMoment: Moment = getRemindMomentJustAfter(moment());
        if (selectedMoment.isSameOrAfter(nextRemindMoment)) {
            let remindContent: string = await this.statusMgr.getContent(userId);
            let remindDatetime: string = formatted(selectedMoment);
            return await this.db
                .insert(userId, remindContent, remindDatetime)
                .then(() => this.statusMgr.reset(userId, true))
                .then(() => this.line.replyText(token, `登録完了\n【内容】\n${remindContent}\n【日時】\n${remindDatetime}`))
                .then(r => {
                    if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                        return true;
                    } else {
                        return false;
                    }
                })
                .catch(e => {
                    console.error(e);
                    return false;
                });
        } else {
            // invalid datetime
            // retry DatetimePicker
            return await this.line.replyDatetimePicker(token)
                .then(r => {
                    if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                        return true;
                    } else {
                        return false;
                    }
                })
                .catch(e => {
                    console.error(e);
                    return false;
                });
        }
    }

    public cancelReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let token: string = event.replyToken;
        let userId: string = event.source.userId;
        let status: Status|null = await this.statusMgr.getStatus(userId);
        let savedContentFlg = status === StatusDef.settingDatetime;
        return await this.statusMgr.reset(userId, savedContentFlg)
            .then(() => this.line.replyText(token, '中断しました。')
            )
            .then(r => {
                if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                    return true;
                } else {
                    return false;
                }
            });
    }

    public backToContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let token: string = event.replyToken;
        let userId: string = event.source.userId;
        return await this.statusMgr.setStatus(userId, StatusDef.settingContent)
            .then(() => this.line.replyText(
                token, '新しいリマインド内容を入力してください。', [ false, true ])
            )
            .then(r => {
                if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                    return true;
                } else {
                    return false;
                }
            });
    }


}