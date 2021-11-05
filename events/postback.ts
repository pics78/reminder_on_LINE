import { PostbackEventForReminder } from './def/types';
import { LINEService } from '../services/lineConnectService';
import { bubbleToConfirmDatetime, bubbleToCreateRemind, bubbleToModifyContent, bubbleToModifyDatetime, bubbleToSelect } from '../services/lineFlexMessagesDef';
import { ReminderDBService } from '../services/dbConnectService';
import { StatusMgr } from '../services/statusService';
import moment, { Moment } from 'moment';

const mu = require('../utils/momentUtil');

export class PostbackEventHandler {
    private statusMgr: StatusMgr;
    private db: ReminderDBService;
    private line: LINEService;
    constructor() {
        this.statusMgr = new StatusMgr();
        this.db = new ReminderDBService();
        this.line = new LINEService();
    }

    public datetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let selectedMoment: Moment = mu.getRemindMomentJustBefore(moment(event.postback.params.datetime));
        let nextRemindMoment: Moment = mu.getRemindMomentJustAfter(moment());
        if (selectedMoment.isSameOrAfter(nextRemindMoment, 'minutes')) {
            let remindContent: string = await this.statusMgr.getContent(event.source.userId);
            let remindDatetime: string = mu.formatted(selectedMoment);
            return await this.db
                .insert(event.source.userId, remindContent, remindDatetime)
                .then(() => this.line.replyFlexBubbleMessage(
                    event.replyToken, bubbleToCreateRemind(remindContent, mu.getDisplayString(remindDatetime)), '登録完了'))
                .then(() => true)
        } else {
            return await this.line.replyDatetimePicker(event.replyToken, [true, true],
                '指定日時が早すぎます。もう一度選択してください。')
                .then(() => false)
        }
    }

    public newDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let selectedMoment: Moment = mu.getRemindMomentJustBefore(moment(event.postback.params.datetime));
        let nextRemindMoment: Moment = mu.getRemindMomentJustAfter(moment());
        if (selectedMoment.isSameOrAfter(nextRemindMoment, 'minutes')) {
            let oldDatetime: string = await this.statusMgr.getDatetime(event.source.userId);
            return await this.line.replyFlexBubbleMessage(
                event.replyToken, bubbleToConfirmDatetime(
                    mu.getDisplayString(new Date(oldDatetime)), mu.getDisplayString(selectedMoment)))
                .then(() => this.statusMgr.setDatetime(event.source.userId, mu.formatted(selectedMoment)));
        } else {
            let target: string = await this.statusMgr.getTarget(event.source.userId);
            let datetime: string = await this.db.selectById(target)
                .then(row => row ? row.rdt : '(日時の取得に失敗しました)');
            let minDatetime: string = mu.formatted(mu.getRemindMomentJustAfter(moment()));
            return await this.line.replyFlexBubbleMessage(
                event.replyToken,
                bubbleToModifyDatetime(mu.getDisplayString(new Date(datetime)), minDatetime, true),
                '日時編集',
                [false, true]
            )
            .then(() => false)
        }
    }

    public cancelReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await this.line.replyText(event.replyToken, '中断しました。')
            .then(() => true);
    }

    public backToContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await this.line.replyText(
                event.replyToken, '新しいリマインド内容を入力してください。', [false, true])
            .then(() => true);
    }

    public modifyReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = event.postback.data.replace(/^action=modify&id=(.*)$/, '$1');
        return await this.statusMgr.setTarget(event.source.userId, target)
            .then(() => this.line.replyFlexBubbleMessage(
                event.replyToken, bubbleToSelect(), '編集モード選択', [false, true]))
            .then(() => true);
    }

    public modifyContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await this.statusMgr.getTarget(event.source.userId);
        let content: string = await this.db.selectById(target)
            .then(row => row ? row.cnt : '(内容の取得に失敗しました)');
        return await this.statusMgr.setContent(event.source.userId, content)
            .then(() => this.line.replyFlexBubbleMessage(
                event.replyToken, bubbleToModifyContent(content), '内容編集', [false, true]))
            .then(() => true);
    }

    public modifyDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await this.statusMgr.getTarget(event.source.userId);
        let datetime: string = await this.db.selectById(target)
            .then(row => row ? row.rdt : '(日時の取得に失敗しました)');
        let minDatetime: string = mu.formatted(mu.getRemindMomentJustAfter(moment()));
        return await this.statusMgr.setDatetime(event.source.userId, datetime)
            .then(() => this.line.replyFlexBubbleMessage(
                event.replyToken,
                bubbleToModifyDatetime(mu.getDisplayString(new Date(datetime)), minDatetime),
                '日時編集',
                [false, true]
            ))
            .then(() => true);
    }

    public deleteReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = event.postback.data.replace(/^action=delete&id=(.*)$/, '$1');
        return await this.db.delete(target, event.source.userId)
            .then(() => this.line.replyText(event.replyToken, '削除しました。'))
            .then(() => true);
    }

    public confirmContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await this.statusMgr.getTarget(event.source.userId);
        let content: string = await this.statusMgr.getContent(event.source.userId);
        return await this.db.updateContent(content, target)
            .then(() => this.line.replyText(event.replyToken, '更新しました。'))
            .then(() => true);
    }

    public confirmDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await this.statusMgr.getTarget(event.source.userId);
        let datetime: string = await this.statusMgr.getDatetime(event.source.userId);
        return await this.db.updateDatetime(datetime, target)
            .then(() => this.line.replyText(event.replyToken, '更新しました。'))
            .then(() => true);
    }

    public retryContent = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await this.line.replyText(event.replyToken, 'もう一度入力してください。')
            .then(() => true);
    }

    public retryDatetime = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let datetime: string = await this.statusMgr.getDatetime(event.source.userId);
        let minDatetime: string = mu.formatted(mu.getRemindMomentJustAfter(moment()));
        return await this.line.replyFlexBubbleMessage(
                event.replyToken,
                bubbleToModifyDatetime(mu.getDisplayString(new Date(datetime)), minDatetime, true),
                '日時編集',
                [false, true]
            )
            .then(() => true);
    }
}