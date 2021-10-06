import { WebhookEvent, MessageAPIResponseBase } from '@line/bot-sdk';
import { Express, Request, Response } from 'express';
import { ClientConfig } from 'pg';
import { LINEService, LINEConfig, StoreConfig } from './services';
import { EventHandler, WebhookEventForReminder } from './events';

const storeConfig: StoreConfig = {
    url:    process.env.REDIS_URL,
}

const dbConfig: ClientConfig = {
    host:       process.env.POSTGRESQL_HOST,
    database:   process.env.POSTGRESQL_DATABASE,
    user:       process.env.POSTGRESQL_USER,
    port:       process.env.POSTGRESQL_PORT,
    password:   process.env.POSTGRESQL_PASS,
    ssl:        { rejectUnauthorized: false },
}

const lineConfig: LINEConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret:      process.env.LINE_CHANNEL_SECRET,
}

const eventHandler: EventHandler = new EventHandler(
    storeConfig, dbConfig, lineConfig
);

const line: LINEService = new LINEService(lineConfig);
const app: Express = require('express')();

app.get('/', (_req: Request, res: Response) => {
    res.send(JSON.stringify({'status': 'OK'}));
});

app.post('/webhook', line.getMiddleware, async (req: Request, res: Response) => {
    const events: WebhookEventForReminder[] = req.body.events;

    await Promise.all(
        events.map(async (event: WebhookEventForReminder) => {
            try {
                console.log(JSON.stringify(event));
                await eventHandler.handle(event);
            } catch (err: unknown) {
                throw err;
            }
        })
    ).then(r => {
        res.status(200).json({
            status: 'success'
        });
    }).catch(e => {
        console.error(e);
        res.status(500).json({
            status: 'error'
        });
    });
});

const PORT = process.env.PORT || process.env.npm_package_config_port;
app.listen(PORT, () => {
    console.log(`Starting Heroku App.`);
});