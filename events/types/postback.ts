import { PostbackEventForReminder } from '../def/types';
import { LINEConnector } from '../../connectors';
import { StatusMgr, LINEMessage, Query } from '../../services';
import { MessageBuilder } from '../..//utils/lineMessageBuilder';
import { Moment } from 'moment';
import { RemindDt, PrintDt } from '../../utils/momentUtil';

const line = new LINEConnector();
const statusMgr = new StatusMgr();
const lineMsg = new LINEMessage();
const query = new Query();
const builder = new MessageBuilder();

export class PostbackEventHandler {
    private constructor() {}

    static datetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let selected: Moment = RemindDt.prev(event.postback.params.datetime);
        if (selected.isSameOrAfter(RemindDt.next(), 'minutes')) {
            let remindContent: string = await statusMgr.getContent(event.source.userId);
            let remindDatetime: string = PrintDt.toDB(selected);
            await query.insert(event.source.userId, remindContent, remindDatetime);

            return await line.replyMessage(event.replyToken, builder.type('flex')
                .altText('登録完了')
                .contents(lineMsg.bubbleToCreateRemind(remindContent, PrintDt.toDisplay(remindDatetime)))
                .build(true)
            )
            .then(() => true);
        } else {
            return await line.replyMessage(event.replyToken, builder.type('template')
                .altText('日時選択')
                .templateType('buttons')
                .title('リマインド日時設定')
                .text('指定日時が早すぎます。もう一度選択してください。')
                .addAction(lineMsg.setDatetimeAction())
                .addQuickReply(lineMsg.quickReplyItem('back'))
                .addQuickReply(lineMsg.quickReplyItem('cancel'))
                .build(true)
            )
            .then(() => false);
        }
    }

    static newDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let selected: Moment = RemindDt.prev(event.postback.params.datetime);
        if (selected.isSameOrAfter(RemindDt.next(), 'minutes')) {
            let oldDatetime: string = await statusMgr.getDatetime(event.source.userId);
            statusMgr.setDatetime(event.source.userId, PrintDt.toDB(selected));
            
            return await line.replyMessage(event.replyToken, builder.type('flex')
                .altText('日時編集確認')
                .contents(lineMsg.bubbleToConfirmDatetime(PrintDt.toDisplay(oldDatetime), PrintDt.toDisplay(selected)))
                .addQuickReply(lineMsg.quickReplyItem('cancel'))
                .build(true)
            )
            .then(() => true);
        } else {
            let target: string = await statusMgr.getTarget(event.source.userId);
            let datetime: string = await query.selectById(target)
                .then(row => row ? row.rdt : '(日時の取得に失敗しました)');
            let minDatetime: string = PrintDt.toDB(RemindDt.next());

            return await line.replyMessage(event.replyToken, builder.type('flex')
                .altText('日時編集')
                .contents(lineMsg.bubbleToModifyDatetime(PrintDt.toDisplay(datetime), minDatetime, true))
                .addQuickReply(lineMsg.quickReplyItem('cancel'))
                .build(true)
            )
            .then(() => false);
        }
    }

    static cancelReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('中断しました。')
            .build()
        )
        .then(() => true);
    }

    static backToContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('新しいリマインド内容を入力してください。')
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build()
        )
        .then(() => true);
    }

    static modifyReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = event.postback.data.replace(/^action=modify&id=(.*)$/, '$1');
        await statusMgr.setTarget(event.source.userId, target);

        return await line.replyMessage(event.replyToken, builder.type('flex')
            .altText('編集モード選択')
            .contents(lineMsg.bubbleToSelect())
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build(true)
        )
        .then(() => true);
    }

    static modifyContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await statusMgr.getTarget(event.source.userId);
        let content: string = await query.selectById(target)
            .then(row => row ? row.cnt : '(内容の取得に失敗しました)');
        await statusMgr.setContent(event.source.userId, content);

        return await line.replyMessage(event.replyToken, builder.type('flex')
            .altText('内容編集')
            .contents(lineMsg.bubbleToModifyContent(content))
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build(true)
        )
        .then(() => true);
    }

    static modifyDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await statusMgr.getTarget(event.source.userId);
        let datetime: string = await query.selectById(target)
            .then(row => row ? row.rdt : '(日時の取得に失敗しました)');
        await statusMgr.setDatetime(event.source.userId, datetime);

        let minDatetime: string = PrintDt.toDB(RemindDt.next());
        return await line.replyMessage(event.replyToken, builder.type('flex')
            .altText('日時編集')
            .contents(lineMsg.bubbleToModifyDatetime(PrintDt.toDisplay(datetime), minDatetime))
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build(true)
            )
            .then(() => true);
    }

    static deleteReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = event.postback.data.replace(/^action=delete&id=(.*)$/, '$1');
        await query.delete(target, event.source.userId);

        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('削除しました。')
            .build()
        )
        .then(() => true);
    }

    static confirmContentReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await statusMgr.getTarget(event.source.userId);
        let content: string = await statusMgr.getContent(event.source.userId);
        await query.updateContent(content, target);

        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('更新しました。')
            .build()
        )
        .then(() => true);
    }

    static confirmDatetimeReturned = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let target: string = await statusMgr.getTarget(event.source.userId);
        let datetime: string = await statusMgr.getDatetime(event.source.userId);
        await query.updateDatetime(datetime, target);

        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('更新しました。')
            .build()
        )
        .then(() => true);
    }

    static retryContent = async (event: PostbackEventForReminder): Promise<Boolean> => {
        return await line.replyMessage(event.replyToken, builder.type('text')
            .text('もう一度入力してください。')
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build()
        )
        .then(() => true);
    }

    static retryDatetime = async (event: PostbackEventForReminder): Promise<Boolean> => {
        let datetime: string = await statusMgr.getDatetime(event.source.userId);
        let minDatetime: string = PrintDt.toDB(RemindDt.next());
        return await line.replyMessage(event.replyToken, builder.type('flex')
            .altText('日時編集')
            .contents(lineMsg.bubbleToModifyDatetime(PrintDt.toDisplay(datetime), minDatetime, true))
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .build(true)
        )
        .then(() => true);
    }
}