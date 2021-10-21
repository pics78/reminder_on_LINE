import { Express, Request, Response } from 'express';
import { lineMiddleware } from './services/lineConnectService';
import { WebhookEventForReminder } from './events/def/types';
import { EventHandler } from './events'
import { formatted } from './utils/momentUtil';

const eventHandler: EventHandler = new EventHandler();
const app: Express = require('express')();

app.get('/', (_req: Request, res: Response) => {
    res.send(JSON.stringify({'status': 'OK'}));
});

// HerokuDynoのスリープ防止コール
app.get('/wakeUp', (_req: Request, res: Response) => {
    console.log('<<<<< Wake Up Call!! >>>>>');
    res.send('What? I\'m not sleeping..');
});

app.post('/webhook', lineMiddleware(), async (req: Request, res: Response) => {
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

const cron = require('node-cron');
const moment = require('moment');

const PORT = process.env.PORT || process.env.npm_package_config_port;
app.listen(PORT, () => {
    console.log('Starting Heroku App.');

    const cronStr: string = process.env.CRON;
    console.log(`Setting remind scheduler with cron [${cronStr}].`);
    cron.schedule(cronStr, async () => {
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