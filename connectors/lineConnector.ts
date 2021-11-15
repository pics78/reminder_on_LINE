import { Client, middleware, MessageAPIResponseBase, Message } from '@line/bot-sdk';
import { MessageBuilder } from '../utils/lineMessageBuilder';

const lineAdmin: string = process.env.LINE_ADMIN_USER_ID;
const builder: MessageBuilder = new MessageBuilder();

export const lineMiddleware = () => {
    return middleware({
        channelSecret: process.env.LINE_CHANNEL_SECRET
    });
}

export class LINEConnector {
    private client: Client;
    constructor() {
        this.client = new Client({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
        });
    }

    public replyMessage = async (token: string, message: Message): Promise<MessageAPIResponseBase> => {
        return await this.client.replyMessage(token, message);
    }

    public sendMessage = async (to: string, message: Message): Promise<MessageAPIResponseBase> => {
        return await this.client.pushMessage(to, message);
    }

    public sendToAdmin = async (text: string): Promise<MessageAPIResponseBase> => {
        return this.sendMessage(lineAdmin, builder.type('text')
            .text(text)
            .build()
        );
    }
}