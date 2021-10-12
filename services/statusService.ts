import Redis from 'ioredis';

export declare type Status =
    'none' |
    'setting_content' | 'setting_datetime' |
    'modify_content'  | 'modify_datetime';

export const isStatus = (s: string): s is Status => {
    return  s === StatusDef.none ||
            s === StatusDef.settingContent ||
            s === StatusDef.settingDatetime ||
            s === StatusDef.modifyContent  ||
            s === StatusDef.modifyDatetime;
}

export class StatusDef {
    static readonly none:            Status = 'none';
    static readonly settingContent:  Status = 'setting_content';
    static readonly settingDatetime: Status = 'setting_datetime';
    static readonly modifyContent:   Status = 'modify_content';
    static readonly modifyDatetime:  Status = 'modify_datetime';

    private constructor(){};
}

export interface StoreConfig {
    url: string
}

export class StatusMgr {
    private redis: Redis.Redis;

    constructor(config: StoreConfig) {
        this.redis = new Redis(config.url);
    }

    public statusKey = (userId: string): string => {
        return `status_${userId}`;
    }

    public contentKey = (userId: string): string => {
        return `content_${userId}`;
    }

    public get = async (key: string): Promise<string|null> => {
        return await this.redis.get(key);
    }

    public set = async (key: string, val: string): Promise<Boolean> => {
        return await this.redis.set(key, val).then(r => r == 'OK' ? true : false);
    }

    public getStatus = async (userId: string): Promise<Status|null> => {
        return await this.get(this.statusKey(userId))
            .then(s => s != null && isStatus(s) ? s : null);
    }

    public setStatus = async (userId: string, status: Status): Promise<Boolean> => {
        return await this.set(this.statusKey(userId), status);
    }

    public getContent = async (userId: string): Promise<string> => {
        return await this.get(this.contentKey(userId))
            .then(content => content != null ? content : '');
    }

    public setContent = async (userId: string, content: string): Promise<Boolean> => {
        return await this.set(this.contentKey(userId), content);
    }

    public reset = async (userId: string, savedContentFlg: Boolean): Promise<Boolean> => {
        let isStatusResetOk = await this.set(this.statusKey(userId), StatusDef.none);
        let isContentResetOk = !isStatusResetOk ? false :
                !savedContentFlg ? true :
                    await this.redis.del(this.contentKey(userId))
                        .then(n => n == 1 ? true : false);
        
        return isStatusResetOk && isContentResetOk;               
    }
}