import { Pool, PoolClient, QueryResult } from 'pg';
import { tn, tc, ReminderRow } from './sql';
import { getId } from '../utils/idUtil';

const sql = {
    select_list: `select * from ${tn} where line_user = $1 and ${tc.snt} = false`,
    select: `select * from ${tn} where ${tc.id} = $1 and ${tc.snt} = false`,
    insert: `insert into ${tn} (${tc.id}, ${tc.usr}, ${tc.cnt}, ${tc.rdt}, ${tc.snt}) values ($1, $2, $3, $4, false)`,
    update_content: `update ${tn} set ${tc.cnt} = $1 where ${tc.id} = $2 and ${tc.snt} = false`,
    update_datetime: `update ${tn} set ${tc.rdt} = $1 where ${tc.id} = $2 and ${tc.snt} = false`,
    delete: `delete from ${tn} where ${tc.id} = $1 and ${tc.usr} = $2`,
    select_remind_targets: `select * from ${tn} where ${tc.rdt} = $1 and ${tc.snt} = false order by ${tc.usr}`,
    sent: `update ${tn} set ${tc.snt} = true where ${tc.id} = $1 and ${tc.usr} = $2`,
};

export class ReminderDBService {
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
                        rdt: row.remind_datetime,
                    });
                });
                return result;
            });
    }

    public selectRemindTargets = async (dt: string): Promise<ReminderRow[]> => {
        return await this.run(sql.select_remind_targets, [dt])
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
            });
    }

    public selectById = async (id: string): Promise<ReminderRow|null> => {
        return await this.run(sql.select, [id])
            .then(qr => {
                if (qr.rowCount === 1) {
                    let row = qr.rows[0];
                    return {
                        id: row.id,
                        usr: row.line_user,
                        cnt: row.content,
                        rdt: row.remind_datetime,
                    };
                } else {
                    return null;
                }
            });
    }

    public checkNumberOfRegist = async (usr: string): Promise<number> => {
        return await this.run(sql.select_list, [usr])
        .then(qr => qr.rowCount);
    }

    public insert = async (usr: string, cnt: string, rdt: string): Promise<QueryResult> => {
        return await this.run(sql.insert, [getId(), usr, cnt, rdt]);
    }

    public updateContent = async (content: string, id: string): Promise<QueryResult> => {
        return await this.run(sql.update_content, [content, id]);
    }

    public updateDatetime = async (datetime: string, id: string): Promise<QueryResult> => {
        return await this.run(sql.update_datetime, [datetime, id]);
    }

    public delete = async (id: string, usr: string): Promise<QueryResult> => {
        return await this.run(sql.delete, [id, usr]);
    }

    public sent = async (id: string, usr: string): Promise<QueryResult> => {
        return await this.run(sql.sent, [id, usr]);
    }
}