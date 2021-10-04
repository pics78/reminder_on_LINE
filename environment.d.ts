declare global {
    namespace NodeJS {
        interface ProcessEnv {
            POSTGRESQL_HOST:        string;
            POSTGRESQL_DATABASE:    string;
            POSTGRESQL_USER:        string;
            POSTGRESQL_PORT:        number;
            POSTGRESQL_PASS:        string;
        }
    }
}
export {};