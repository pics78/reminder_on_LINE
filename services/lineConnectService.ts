import { Client, ClientConfig, middleware, MiddlewareConfig, MessageAPIResponseBase, Message, QuickReply, QuickReplyItem } from '@line/bot-sdk';
import { getRemindMomentJustAfter, formatted } from '../utils/momentUtil'
import moment from 'moment';

export interface LINEConfig extends ClientConfig, MiddlewareConfig {
    channelAccessToken: string;
    channelSecret: string;
}

export declare type QuickReplyFlgs = [
    backToContentFlg: Boolean, cancelFlg: Boolean
];

export const lineMiddleware = (config: LINEConfig) => {
    return middleware(config);
}

export class LINEService {
    private client: Client;
    constructor(config: LINEConfig) {
        this.client = new Client(config);
    }

    public replyText = async (token: string, text: string, quickReplyFlgs?: QuickReplyFlgs): Promise<MessageAPIResponseBase> => {
        let message: Message = {
            type: 'text',
            text: text,
        };
        if (quickReplyFlgs) {
            message.quickReply = this.addQuickReplyObj(quickReplyFlgs);
        }
        return await this.client.replyMessage(token, message);
    }

    public replyDatetimePicker = async (token: string, quickReplyFlgs?: QuickReplyFlgs): Promise<MessageAPIResponseBase> => {
        const minDatetime: string = formatted(getRemindMomentJustAfter(moment()));
        let message: Message = {
            type: 'template',
            altText: '日時選択',
            template: {
                type: 'buttons',
                title: 'リマインド日時設定',
                text: '毎時0分から5分間隔で、その時刻から次の処理時刻までの間に設定されたリマインドの処理を行います。',
                actions: [
                    {
                        type: 'datetimepicker',
                        label: '選択',
                        data: 'action=set_remind_datetime',
                        mode: 'datetime',
                        min: minDatetime,
                    }
                ]
            }
        }
        if (quickReplyFlgs) {
            message.quickReply = this.addQuickReplyObj(quickReplyFlgs);
        }
        return await this.client.replyMessage(token, message);
    }

    public addQuickReplyObj = (quickReplyFlgs: QuickReplyFlgs): QuickReply => {
        let quickReplyItems: QuickReplyItem[] = [];
        if (quickReplyFlgs[0]) {
            quickReplyItems.push({
                type: 'action',
                action: {
                    type: 'postback',
                    label: '内容入力に戻る',
                    text: '$back',
                    data: 'action=back',
                }
            });
        }
        if (quickReplyFlgs[1]) {
            quickReplyItems.push({
                type: 'action',
                action: {
                    type: 'postback',
                    label: '中断する',
                    text: '$cancel',
                    data: 'action=cancel',
                }
            });
        }
        return { items: quickReplyItems };
    }
}