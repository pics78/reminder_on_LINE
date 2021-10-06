import { rejects } from 'assert';
import { Pool, PoolClient, ClientConfig, QueryResult } from 'pg';
import { tn, tc, ReminderRow, QueryString } from './sql'

interface ReminderQueryString extends QueryString {
    select_list: string,
    insert: string,
}

const sql: ReminderQueryString = {
    select_list: `select * from ${tn} where line_user = $1`,
    insert: `insert into ${tn}(${tc.usr}, ${tc.cnt}, ${tc.rdt}) values ($1, $2, $3)`,
};

export class ReminderDBService {
    private pool: Pool;

    constructor(config: ClientConfig) {
        this.pool = new Pool(config);
    }

    private run = async (query: string, values: any[]): Promise<QueryResult> => {
        return new Promise(resolve => {
            this.pool.connect((connectError: Error, poolClient: PoolClient) => {
                if (connectError) {
                    console.error(connectError);
                    throw connectError;
                } else {
                    poolClient.query(query, values, (queryError: Error, queryResult: QueryResult<any>) => {
                        if (queryError) {
                            console.error(queryError);
                            throw queryError;
                        } else {
                            resolve(queryResult);
                        }
                    });
                }
            });
        });
    }

    public selectAll = async (usr: string): Promise<ReminderRow[]> => {
        return await this.run(sql.select_list, [usr])
            .then(qr => {
                let result: ReminderRow[] = [];
                qr.rows.map(row => {
                    result.push({
                        id: row.id,
                        usr: row.line_user,
                        cnt: row.content,
                        rdt: row.remind_datetime,
                    });
                });
                return result;
            })
            .catch(e => {
                console.log(e);
                throw e;
            });
    }

    public insert = async (usr: string, cnt: string, rdt: string): Promise<void> => {
        return await this.run(sql.insert, [usr, cnt, rdt])
            .then(qr => {
                if (qr.rowCount == 1) {
                    console.log('inserted a record.');
                }
            })
            .catch(e => {
                console.log(e);
                throw e;
            });
    }
}