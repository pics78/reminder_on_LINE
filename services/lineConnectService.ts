import { Client, ClientConfig, middleware, MiddlewareConfig, MessageAPIResponseBase } from '@line/bot-sdk';
import { Middleware } from '@line/bot-sdk/dist/middleware';
import moment, { Moment } from 'moment';
import { getRemindMomentJustAfter, getRemindMomentJustBefore, formatted } from '../utils/momentUtil'

export interface LINEConfig extends ClientConfig, MiddlewareConfig {
    channelAccessToken: string;
    channelSecret: string;
}

export class LINEService {
    private client: Client;
    private middleware: Middleware;

    constructor(config: LINEConfig) {
        this.client = new Client(config);
        this.middleware = middleware(config);
    }

    public get getMiddleware() {
        return this.middleware;
    }

    public replyText = async (token: string, text: string): Promise<MessageAPIResponseBase> => {
        return this.client.replyMessage(token, {
            type: 'text',
            text: text
        });
    }

    public replyDatetimePicker = async (token: string) => {
        const minDatetime: string = formatted(getRemindMomentJustAfter(moment()));
        return this.client.replyMessage(token, {
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
        });
    }
}