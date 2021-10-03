import express, { Application } from 'express';

const PORT = process.env.npm_package_config_port;
const app: Application = express();

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
});