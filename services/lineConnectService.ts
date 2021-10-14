import { Client, ClientConfig, middleware, MiddlewareConfig, MessageAPIResponseBase, Message, QuickReply, QuickReplyItem, FlexBubble } from '@line/bot-sdk';
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

    public replyFlexCarouselMessages = async (token: string, bubbles: FlexBubble[], altText?: string) => {
        return await this.client.replyMessage(token, {
            type: 'flex',
            altText: altText || 'flex message',
            contents: {
                type: 'carousel',
                contents: bubbles,
            }
        });
    }

    public addFlexBubbleObj = (reminderId: number, content: string, datetime: string, number: number): FlexBubble => {
        return {
            type: "bubble",
            header: {
              type: "box",
              layout: "horizontal",
              contents:[
                {
                  type: "text",
                  text: "登録リマインド",
                  color: "#00CB32",
                  weight: "bold",
                  size: "xs"
                },
                {
                  type: "text",
                  text: `(${number}/13)`,
                  size: "xs",
                  weight: "bold",
                  offsetEnd: "11%"
                }
              ],
              position: "relative"
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'vertical',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    {
                                        type: 'text',
                                        text: '内容',
                                        size: 'sm',
                                        color: '#00CB32',
                                        weight: 'bold',
                                        decoration: 'underline',
                                        offsetBottom: 'md'
                                    },
                                    {
                                        type: 'text',
                                        text: content,
                                        size: 'sm',
                                        color: '#111111',
                                        align: 'start',
                                        wrap: true
                                    }
                                ],
                                position: 'relative',
                                paddingTop: 'xxl'
                            },
                            {
                                type: 'separator',
                                margin: 'md',
                                color: '#B2B2B2'
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    {
                                    type: 'text',
                                    text: '日時',
                                    size: 'sm',
                                    color: '#00CB32',
                                    weight: 'bold',
                                    decoration: 'underline',
                                    offsetBottom: 'md'
                                    },
                                    {
                                    type: 'text',
                                    text: datetime,
                                    size: 'sm',
                                    color: '#111111',
                                    align: 'center'
                                    }
                                ],
                                position: 'relative',
                                margin: 'xs',
                                paddingTop: 'xxl'
                            }
                        ]
                    }
                ],
                paddingTop: 'xs'
            },
            footer: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    {
                    type: 'button',
                    action: {
                        type: 'postback',
                        label: '編集',
                        data: `action=modify&id=${reminderId}`,
                        displayText: '$modify'
                    },
                    position: 'relative',
                    color: '#00CB00'
                    },
                    {
                    type: 'separator',
                    color: '#B2B2B2'
                    },
                    {
                    type: 'button',
                    action: {
                        type: 'postback',
                        label: '削除',
                        data: `action=deletey&id=${reminderId}`,
                        displayText: '$delete'
                    },
                    position: 'relative',
                    color: '#00BFFF'
                    }
                ]
            },
            styles: {
                header: {
                  separator: true,
                  backgroundColor: "#E5E5E5"
                },
                footer: {
                  separator: true
                }
              }
        }
    }
}