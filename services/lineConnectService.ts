import { Client, ClientConfig, middleware, MiddlewareConfig, MessageAPIResponseBase } from '@line/bot-sdk';
import { getRemindMomentJustAfter, formatted } from '../utils/momentUtil'
import moment from 'moment';

export interface LINEConfig extends ClientConfig, MiddlewareConfig {
    channelAccessToken: string;
    channelSecret: string;
}

export const lineMiddleware = (config: LINEConfig) => {
    return middleware(config);
}

export class LINEService {
    private client: Client;
    constructor(config: LINEConfig) {
        this.client = new Client(config);
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


// TODO
// クイックリプライ機能を使って登録中に入力した内容などを戻って変更できるようにする
// https://developers.line.biz/ja/docs/messaging-api/using-quick-reply/#set-quick-reply-buttons

// 日時選択状態時にクイックリプライの内容編集を押すともう一度内容を入力できる
// 内容入力または日時選択状態時にクイックリプライの取り消しを押すとリマインド登録状態をキャンセルできる
// など