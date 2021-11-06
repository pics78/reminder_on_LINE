import Redis from 'ioredis';

export declare type Status =
    'none' | 'setting_content' | 'setting_datetime' | 'modify' | 'modify_content'  | 'modify_datetime' | 'confirm_content' | 'confirm_datetime';

export const isStatus = (s: string): s is Status => {
    return  s === StatusDef.none ||
            s === StatusDef.settingContent ||
            s === StatusDef.settingDatetime ||
            s === StatusDef.modify ||
            s === StatusDef.modifyContent ||
            s === StatusDef.modifyDatetime ||
            s === StatusDef.confirmContent ||
            s === StatusDef.confirmDatetime;
}

export class StatusDef {
    static readonly none:            Status = 'none';
    static readonly settingContent:  Status = 'setting_content';
    static readonly settingDatetime: Status = 'setting_datetime';
    static readonly modify:          Status = 'modify';
    static readonly modifyContent:   Status = 'modify_content';
    static readonly modifyDatetime:  Status = 'modify_datetime';
    static readonly confirmContent:  Status = 'confirm_content';
    static readonly confirmDatetime: Status = 'confirm_datetime';

    private constructor(){};
}

export declare type DataType =
    'content' | 'datetime' | 'target';

export class StatusMgr {
    private redis: Redis.Redis;

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
    }

    public statusKey = (userId: string): string => {
        return `status_${userId}`;
    }

    public dataKey = (userId: string): string => {
        return `data_${userId}`;
    }

    public getData = async (userId: string, type: DataType): Promise<string> => {
        return this.redis.hget(this.dataKey(userId), type)
            .then(content => content != null ? content : '');
    }

    public setData = async (userId: string, type: DataType, data: string): Promise<Boolean> => {
        return this.redis.hset(this.dataKey(userId), type, data)
            .then(() => true);
    }

    public getStatus = async (userId: string): Promise<Status|null> => {
        return await this.redis.get(this.statusKey(userId))
            .then(s => s != null && isStatus(s) ? s : null);
    }

    public setStatus = async (userId: string, status: Status) => {
        return await this.redis.set(this.statusKey(userId), status)
            .then(r => r === 'OK' ? true : false);
    }

    public getContent = async (userId: string): Promise<string> => {
        return await this.getData(userId, 'content')
            .then(content => content != null ? content : '');
    }

    public setContent = async (userId: string, content: string): Promise<Boolean> => {
        return await this.setData(userId, 'content', content);
    }

    public getTarget = async (userId: string): Promise<string> => {
        return await this.getData(userId, 'target')
            .then(target => target != null ? target : '');
    }

    public setTarget = async (userId: string, target: string): Promise<Boolean> => {
        return await this.setData(userId, 'target', target);
    }

    public getDatetime = async (userId: string): Promise<string> => {
        return await this.getData(userId, 'datetime')
            .then(dt => dt != null ? dt : '');
    }

    public setDatetime = async (userId: string, datetime: string): Promise<Boolean> => {
        return await this.setData(userId, 'datetime', datetime);
    }

    public reset = async (userId: string): Promise<Boolean> => {
        return Promise.all([
            await this.redis.set(this.statusKey(userId), StatusDef.none),
            await this.redis.del(this.dataKey(userId))])
        .then(results =>
            results[0] === 'OK' && results[1] === 1 ? true : false);
    };
}