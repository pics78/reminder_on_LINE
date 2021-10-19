declare global {
    namespace NodeJS {
        interface ProcessEnv {
            POSTGRESQL_HOST:            string;
            POSTGRESQL_DATABASE:        string;
            POSTGRESQL_USER:            string;
            POSTGRESQL_PORT:            number;
            POSTGRESQL_PASS:            string;
            LINE_CHANNEL_ACCESS_TOKEN:  string;
            LINE_CHANNEL_SECRET:        string;
            REDIS_URL:                  string;
            CRON:                       string;
        }
    }
}
export {};