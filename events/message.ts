import { MessageEventForReminder } from './def/types';
import { LINE_REQUEST_ID_HTTP_HEADER_NAME, FlexBubble } from '@line/bot-sdk';
import { LINEService } from '../services/lineConnectService';
import { bubbleForList, bubbleToConfirmContent } from '../services/lineFlexMessagesDef';
import { ReminderDBService } from '../services/dbConnectService';
import { getDisplayString } from '../utils/momentUtil';
import { StatusMgr } from '../services/statusService';

export class MessageEventHandler {
    private statusMgr: StatusMgr;
    private db: ReminderDBService;
    private line: LINEService;
    constructor() {
        this.statusMgr = new StatusMgr();
        this.db = new ReminderDBService();
        this.line = new LINEService();
    }

    public startRegist = async (event: MessageEventForReminder) => {
        return await this.line.replyText(
            event.replyToken, '登録処理を開始します。\nリマインド内容を送信してください。', [false, true]);
    }

    public contentReturned = async (event: MessageEventForReminder) => {
        let content: string = event.message.text;
        return await this.statusMgr.setContent(event.source.userId, content)
            .then(() => this.line.replyDatetimePicker(event.replyToken, [true, true]))
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
            .then(() => this.statusMgr.setContent(event.source.userId, newContent));
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