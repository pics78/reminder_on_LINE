import Redis from 'ioredis';

export declare type Status =
    'none' |
    'setting_content' | 'setting_datetime' |
    'modify' | 'modify_content'  | 'modify_datetime' |
    'confirm_content' | 'confirm_datetime';

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
    static readonly confirmContent:   Status = 'confirm_content';
    static readonly confirmDatetime:  Status = 'confirm_datetime';

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

    public datetimeKey = (userId: string): string => {
        return `datetime_${userId}`;
    }

    public modifyTargetKey = (userId: string): string => {
        return `modify_target_${userId}`;
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

    public getTarget = async (userId: string): Promise<string> => {
        return await this.get(this.modifyTargetKey(userId))
            .then(target => target != null ? target : '');
    }

    public setTarget = async (userId: string, target: string): Promise<Boolean> => {
        return await this.set(this.modifyTargetKey(userId), target);
    }

    public getDatetime = async (userId: string): Promise<string> => {
        return await this.get(this.datetimeKey(userId))
            .then(target => target != null ? target : '');
    }

    public setDatetime = async (userId: string, target: string): Promise<Boolean> => {
        return await this.set(this.datetimeKey(userId), target);
    }

    public reset = async (userId: string): Promise<Boolean> => {
        try {
            await this.set(this.statusKey(userId), StatusDef.none);
            await this.redis.del(
                this.contentKey(userId), this.datetimeKey(userId), this.modifyTargetKey(userId));
            return true;
        } catch (e: any) {
            console.error(e);
            return false;
        }
    }
}