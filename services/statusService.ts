
import Redis from 'ioredis';

declare type Status =
    'none' | 'setting_content' | 'setting_datetime' | 'modify_content' | 'modify_datetime';

export class StatusDef {
    static readonly none: Status = 'none';
    static readonly settingContent: Status = 'setting_content';
    static readonly settingDatetime: Status = 'setting_datetime';
    static readonly modifyContent: Status = 'modify_content';
    static readonly modifyDatetime: Status = 'modify_datetime';

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

    public get = async (key: string): Promise<string> => {
        return this.redis.get(key)
            .then(s => s != null ? s : '')
            .catch(e => {
                console.error(e);
                return '';
            });
    }

    public set = async (key: string, val: string): Promise<'OK'|'NG'> => {
        return this.redis.set(key, val)
            .then(ok => ok == 'OK' ? 'OK' : 'NG')
            .catch(e => {
                console.error(e);
                return 'NG';
            });
    }

    public getStatus = async (userId: string): Promise<string> => {
        return this.get(this.statusKey(userId));
    }

    public setStatus = async (userId: string, status: Status): Promise<'OK'|'NG'> => {
        return this.set(this.statusKey(userId), status);
    }

    public isStatus = async (userId: string, status: string): Promise<Boolean> => {
        return await this.getStatus(userId)
            .then(s => s == status)
            .catch(e => {
                console.error(e);
                return false;
            });
    }

    public getContent = async (userId: string): Promise<string> => {
        return this.get(this.contentKey(userId));
    }

    public setContent = async (userId: string, content: string): Promise<'OK'|'NG'> => {
        return this.set(this.contentKey(userId), content);
    }

    public reset = async (userId: string): Promise<'OK'|'NG'> => {
        return this.set(this.statusKey(userId), StatusDef.none)
            .then(ok => this.redis.del(this.contentKey(userId)))
            .then(n => n == 1 ? 'OK' : 'NG')
            .catch(e => {
                console.error(e);
                return 'NG';
            });
    }
}