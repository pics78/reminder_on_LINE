import express, { Application } from 'express';
import { Pool } from 'pg';

// require('dotenv').config();

const PORT = process.env.npm_package_config_port;

const pool: Pool = new Pool({
    host:       process.env.POSTGRESQL_HOST,
    database:   process.env.POSTGRESQL_DATABASE,
    user:       process.env.POSTGRESQL_USER,
    port:       process.env.POSTGRESQL_PORT,
    password:   process.env.POSTGRESQL_PASS
});

pool.connect((err, poolClient) => {
    if (err) {
        console.log(err);
    } else {
        poolClient.query('select * from reminders', (err, result) => {
            console.log(result.rows);
        });
    }
});

const app: Application = express();

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
});