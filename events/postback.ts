import { ReminderEventBase } from './base';
import { LINE_REQUEST_ID_HTTP_HEADER_NAME, MessageAPIResponseBase } from '@line/bot-sdk';
import { ClientConfig } from 'pg';
import {ReminderDBService, LINEService, LINEConfig, StatusMgr, StatusDef, StoreConfig } from '../services';
import moment, { Moment } from 'moment';
import { getRemindMomentJustAfter, getRemindMomentJustBefore, formatted } from '../utils/momentUtil'

export declare type PostbackEventForReminder = {
    type: 'postback';
    postback: {
        data: string;
        params: {
            datetime: string;
        }
    }
} & ReminderEventBase;

export class PostbackEventHandler {
    private statusMgr: StatusMgr;
    private db: ReminderDBService;
    private line: LINEService;
    constructor(storeConfig: StoreConfig, dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.statusMgr = new StatusMgr(storeConfig);
        this.db = new ReminderDBService(dbConfig);
        this.line = new LINEService(lineConfig);
    }

    public datetimeReturned = async (event: PostbackEventForReminder): Promise<'OK'|'NG'> => {
        // リマインド日時取得 -> リマインド登録処理
        let userId: string = event.source.userId;
        let status: string = await this.statusMgr.getStatus(userId);
        if (status !== StatusDef.settingDatetime) {
            console.error(`unexpected status: ${status}, expected: ${StatusDef.settingDatetime}`);
            return 'NG';
        }
        console.log(JSON.stringify(event));
        let selectedMoment: Moment = getRemindMomentJustBefore(moment(event.postback.params.datetime));
        let nextRemindMoment: Moment = getRemindMomentJustAfter(moment());
        if (selectedMoment.isSameOrAfter(nextRemindMoment)) {
            let remindContent: string = await this.statusMgr.getContent(userId);
            let remindDatetime: string = formatted(selectedMoment);
            return await this.db
                .insert(userId, remindContent, remindDatetime)
                .then(() => this.statusMgr.reset(userId))
                .then(() => this.line.replyText(event.replyToken, `登録完了\n【内容】\n${remindContent}\n【日時】\n${remindDatetime}`))
                .then(r => {
                    if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                        return 'OK';
                    } else {
                        return 'NG';
                    }
                })
                .catch(e => {
                    console.error(e);
                    return 'NG';
                });
        } else {
            // invalid datetime
            // retry DatetimePicker
            return await this.line.replyDatetimePicker(event.replyToken)
                .then(r => {
                    if (r[LINE_REQUEST_ID_HTTP_HEADER_NAME]) {
                        return 'OK';
                    } else {
                        return 'NG';
                    }
                })
                .catch(e => {
                    console.error(e);
                    return 'NG';
                });
        }
    }

}