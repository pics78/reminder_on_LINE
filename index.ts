import { Express, Request, Response } from 'express';
import { Pool, PoolClient, QueryResult } from 'pg';

const PORT = process.env.npm_package_config_port;

const app: Express = require('express')();

const pool: Pool = new Pool({
    host:       process.env.POSTGRESQL_HOST,
    database:   process.env.POSTGRESQL_DATABASE,
    user:       process.env.POSTGRESQL_USER,
    port:       process.env.POSTGRESQL_PORT,
    password:   process.env.POSTGRESQL_PASS,
    ssl:        { rejectUnauthorized: false }
});

const pgConnectTest = async (query: string) => {
    pool.connect((err: Error, poolClient: PoolClient) => {
        if (err) {
            console.log(err);
        } else {
            poolClient.query(query, (err: Error, result: QueryResult<any>) => {
                console.log(result.rows);
            });
        }
    });
};

app.get('/', (req: Request, res: Response) => {
    pgConnectTest('select * from reminders');
    res.send(JSON.stringify({'status': 'OK'}));
});

app.listen(process.env.PORT || PORT, () => {
    console.log(`Starting Heroku App.`);
});