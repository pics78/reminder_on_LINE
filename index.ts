import { Client, ClientConfig , middleware, MiddlewareConfig, WebhookEvent, TextMessage, MessageAPIResponseBase, SignatureValidationFailed } from '@line/bot-sdk';
import { Express, Request, Response } from 'express';
import { resolve } from 'path/posix';
import { Pool, PoolClient, QueryResult, QueryResultBase } from 'pg';

const clientConfig: ClientConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret:      process.env.LINE_CHANNEL_SECRET
};

const middlewareConfig: MiddlewareConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret:      process.env.LINE_CHANNEL_SECRET || ''
};

const client = new Client(clientConfig);

const pool: Pool = new Pool({
    host:       process.env.POSTGRESQL_HOST,
    database:   process.env.POSTGRESQL_DATABASE,
    user:       process.env.POSTGRESQL_USER,
    port:       process.env.POSTGRESQL_PORT,
    password:   process.env.POSTGRESQL_PASS,
    ssl:        { rejectUnauthorized: false }
});

const pgConnectTest = async (query: string, callback: (err: Error, testResult: string) => void) => {
    let result: string = '';
    pool.connect((connectError: Error, poolClient: PoolClient) => {
        if (connectError) {
            callback(connectError, 'reply error');
        } else {
            poolClient.query(query, (queryError: Error, queryResult: QueryResult<any>) => {
                if (queryError) {
                    callback(queryError, 'reply error');
                } else {
                    let list: string[] = [];
                    queryResult.rows.map((row) => {
                        list.push(`user: ${row.line_user}`);
                        list.push(`content: ${row.content}`);
                    });
                    result = list.join('\n');
                    console.log('1: ' + result);
                    callback(queryError, result);
                }
            });
        }
    });
};

const textEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }
    
    pgConnectTest('select * from reminders', (err: Error, testResult: string) => {
        if (err) {
            console.error(err);
        }
        console.log('2: ' + testResult);
        const response: TextMessage = {
            type: 'text',
            text: testResult
        };
        console.log('3: ' + testResult);
        client.replyMessage(event.replyToken, response);
    });
};

const app: Express = require('express')();

app.get('/', (req: Request, res: Response) => {
    res.send(JSON.stringify({'status': 'OK'}));
});

app.post('/webhook', middleware(middlewareConfig), async (req: Request, res: Response) => {
    const events: WebhookEvent[] = req.body.events;

    await Promise.all(
        events.map(async (event: WebhookEvent) => {
            try {
                await textEventHandler(event);
            } catch (err: unknown) {
                throw err;
            }
        })
    ).then(r => {
        console.log(r);
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