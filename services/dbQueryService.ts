import { QueryResult } from 'pg';
import { Postgresql } from '../connectors/postgresConnector';
import { SQL_CONST } from './sql';
import { getId } from '../utils/idUtil';

const { table, column } = SQL_CONST;

export declare type ReminderRow = {
    id: string,
    usr: string,
    cnt: string,
    rdt: string,
    snt?: string,
}

const postgresql: Postgresql = new Postgresql();

export class Query {
    constructor() {}

    public selectAll = async (usr: string): Promise<ReminderRow[]> => {
        return await postgresql.run(
            `select * from ${table} where line_user = $1 and ${column.snt} = false order by ${column.cdt} ASC`,
            [usr]
        )
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
        return await postgresql.run(
            `select * from ${table} where ${column.rdt} = $1 and ${column.snt} = false order by ${column.usr}, ${column.cdt} ASC`,
            [dt])
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
        return await postgresql.run(
            `select * from ${table} where ${column.id} = $1 and ${column.snt} = false`,
            [id])
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

    public insert = async (usr: string, cnt: string, rdt: string): Promise<QueryResult> => {
        return await postgresql.run(
            `insert into ${table} (${column.id}, ${column.usr}, ${column.cnt}, ${column.rdt}, ${column.snt}) values ($1, $2, $3, $4, false)`,
            [getId(), usr, cnt, rdt]);
    }

    public updateContent = async (content: string, id: string): Promise<QueryResult> => {
        return await postgresql.run(
            `update ${table} set ${column.cnt} = $1 where ${column.id} = $2 and ${column.snt} = false`,
            [content, id]);
    }

    public updateDatetime = async (datetime: string, id: string): Promise<QueryResult> => {
        return await postgresql.run(
            `update ${table} set ${column.rdt} = $1 where ${column.id} = $2 and ${column.snt} = false`,
            [datetime, id]);
    }

    public delete = async (id: string, usr: string): Promise<QueryResult> => {
        return await postgresql.run(
            `delete from ${table} where ${column.id} = $1 and ${column.usr} = $2`,
            [id, usr]);
    }

    public sent = async (id: string, usr: string): Promise<QueryResult> => {
        return await postgresql.run(
            `update ${table} set ${column.snt} = true where ${column.id} = $1 and ${column.usr} = $2`,
            [id, usr]);
    }
}