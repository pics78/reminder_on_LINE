import { Pool, PoolClient, ClientConfig, QueryResult } from 'pg';
import { tn, tc, ReminderRow, QueryString } from './sql';
import { getDisplayString } from '../utils/momentUtil';
import { getId } from '../utils/idUtil';

interface ReminderQueryString extends QueryString {
    select_list: string,
    insert: string,
    update: string,
    delete: string,
}

const sql: ReminderQueryString = {
    select_list: `select * from ${tn} where line_user = $1`,
    insert: `insert into ${tn} (${tc.id}, ${tc.usr}, ${tc.cnt}, ${tc.rdt}) values ($1, $2, $3, $4)`,
    update: `update ${tn} set $1 = $2 where ${tc.id} = $3`,
    delete: `delete from ${tn} where ${tc.id} = ${1}`,
};

export class ReminderDBService {
    private pool: Pool;

    constructor(config: ClientConfig) {
        this.pool = new Pool(config);
    }

    public run = async (query: string, values: any[]): Promise<QueryResult> => {
        return new Promise(resolve => {
            this.pool.connect((connectError: Error, poolClient: PoolClient) => {
                if (connectError) throw connectError;
                else {
                    poolClient.query(query, values, (queryError: Error, queryResult: QueryResult<any>) => {
                        if (queryError) throw queryError;
                        else {
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
                        rdt: getDisplayString(row.remind_datetime),
                    });
                });
                return result;
            });
    }

    public checkNumberOfRegist = async (usr: string): Promise<number> => {
        return await this.run(sql.select_list, [usr])
        .then(qr => qr.rowCount);
    }

    public insert = async (usr: string, cnt: string, rdt: string): Promise<QueryResult> => {
        return await this.run(sql.insert, [getId(usr), usr, cnt, rdt]);
    }

    public updateContent = async (content: string, id: number) => {
        return await this.run(sql.update, [tc.cnt, content, id]);
    }

    public updateDatetime = async (datetime: string, id: number) => {
        return await this.run(sql.update, [tc.rdt, datetime, id]);
    }
}