import { Pool, PoolClient, QueryResult } from 'pg';

export class Postgresql {
    private pool: Pool;
    constructor() {
        this.pool = new Pool({
            host:       process.env.POSTGRESQL_HOST,
            database:   process.env.POSTGRESQL_DATABASE,
            user:       process.env.POSTGRESQL_USER,
            port:       process.env.POSTGRESQL_PORT,
            password:   process.env.POSTGRESQL_PASS,
            ssl:        { rejectUnauthorized: false },
        });
    }

    public run = async (query: string, values: any[]): Promise<QueryResult> => {
        const client: PoolClient = await this.pool.connect();
        return client.query(query, values)
            .finally(() => client.release(true));
    }
}