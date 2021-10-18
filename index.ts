import { Express, Request, Response } from 'express';
import { ClientConfig } from 'pg';
import { LINEConfig, lineMiddleware } from './services/lineConnectService';
import { StoreConfig } from './services/statusService';
import { WebhookEventForReminder } from './events/def/types';
import { EventHandler } from './events'
import { formatted } from './utils/momentUtil';

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

const app: Express = require('express')();

app.get('/', (_req: Request, res: Response) => {
    res.send(JSON.stringify({'status': 'OK'}));
});

app.post('/webhook', lineMiddleware(lineConfig), async (req: Request, res: Response) => {
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

    const cron = require('node-cron');
    const moment = require('moment');
    cron.schedule('*/5 * * * *', async () => {
        try {
            await eventHandler.remind()
                .then(() => {
                    const schedulerRunningTime: string = formatted(moment());
                    console.log(`[${schedulerRunningTime}]: Scheduler succeeded.`);
                });
        } catch(e: unknown) {
            console.error('Scheduler failed.');
            console.error(e);
        }
    });
});