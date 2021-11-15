import { FlexBubble } from '@line/bot-sdk';
import { MessageEventForReminder } from '../def/types';
import { LINEConnector } from '../../connectors';
import { StatusMgr, LINEMessage, Query, ReminderRow } from '../../services';
import { MessageBuilder } from '../../utils/lineMessageBuilder';
import { PrintDt } from '../../utils/momentUtil';

const line = new LINEConnector();
const statusMgr = new StatusMgr();
const lineMsg = new LINEMessage();
const query = new Query();
const builder = new MessageBuilder();

export class MessageEventHandler {
    private constructor() {}

    static startRegist = async (event: MessageEventForReminder): Promise<Boolean> => {
        const maxReminder: number = 12;
        const reminderList: ReminderRow[] = await query.selectAll(event.source.userId);
        if (reminderList.length < maxReminder) {
            return await line.replyMessage(event.replyToken, builder.type('text')
                .text('登録処理を開始します。\nリマインド内容を送信してください。')
                .addQuickReply(lineMsg.quickReplyItem('cancel'))
                .flush()
            )
            .then(() => true);
        } else {
            return await line.replyMessage(event.replyToken, builder.type('text')
                .text('リマインダ設定上限の12個に達しているため、登録できません。')
                .flush()
            )
            .then(() => false);
        }
    }

    static contentReturned = async (event: MessageEventForReminder): Promise<Boolean> => {
        let content: string = event.message.text;
        await statusMgr.setContent(event.source.userId, content)

        return await line.replyMessage(event.replyToken, builder.type('template')
            .altText('日時選択')
            .templateType('buttons')
            .title('リマインド日時設定')
            .text('毎時0分から5分間隔で、その時刻から次の処理時刻までの間に設定されたリマインドの処理を行います。')
            .addAction(lineMsg.setDatetimeAction())
            .addQuickReply(lineMsg.quickReplyItem('back'))
            .addQuickReply(lineMsg.quickReplyItem('cancel'))
            .flush(true)
        )
        .then(() => true);
    }

    static newContentReturned = async (event: MessageEventForReminder): Promise<Boolean> => {
        let newContent: string = event.message.text;
        let oldContent: string = await statusMgr.getContent(event.source.userId);
        statusMgr.setContent(event.source.userId, newContent);

        return await line.replyMessage(event.replyToken, builder.type('flex')
                .altText('内容編集確認')
                .contents(lineMsg.bubbleToConfirmContent(oldContent, newContent))
                .addQuickReply(lineMsg.quickReplyItem('cancel'))
                .flush(true)
            )
            .then(() => true);
    }

    static showList = async (event: MessageEventForReminder): Promise<Boolean> => {
        const reminderList: ReminderRow[] = await query.selectAll(event.source.userId);
        if (reminderList.length > 0) {
            let bubbles: FlexBubble[] = [];
            let n: number = 1;
            reminderList.map(row => {
                bubbles.push(lineMsg.bubbleForList(n, row.id, row.cnt, PrintDt.toDisplay(row.rdt)));
                n++;
            });
            return await line.replyMessage(event.replyToken, builder.type('flex')
                .altText('リマインダ一覧')
                .contents({
                    type: 'carousel',
                    contents: bubbles,
                })
                .flush(true)
            )
            .then(() => true);
        } else {
            return await line.replyMessage(event.replyToken, builder.type('text')
                .text('現在、登録されているリマインドはありません。')
                .flush()
            )
            .then(() => true);
        }
    }
}