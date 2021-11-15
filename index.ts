import { Express, Request, Response } from 'express';
import { lineMiddleware } from './connectors/lineConnector';
import { WebhookEventForReminder } from './events/def/types';
import { EventHandler } from './events'

const cron = require('node-cron');
const app: Express = require('express')();

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
                await EventHandler.handle(event);
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
    console.log('Starting Heroku App.');

    const cronStr: string = process.env.CRON;
    console.log(`Setting remind scheduler with cron [${cronStr}].`);
    cron.schedule(cronStr, async () => {
        try {
            await EventHandler.remind()
                .then(dt /*(scheduler running time)*/ => {
                    console.log(`[${dt}]: Scheduler succeeded.`);
                });
        } catch(e: unknown) {
            console.error('Scheduler failed.');
            console.error(e);
        }
    });
});