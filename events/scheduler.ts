import { ClientConfig } from 'pg';
import { LINEService, LINEConfig } from '../services/lineConnectService';
import { ReminderDBService } from '../services/dbConnectService';
import { StatusMgr, StoreConfig } from '../services/statusService';
import { getRemindMomentJustBefore, formatted } from '../utils/momentUtil'
import moment from 'moment';

export class SchedulerHandler {
    private db: ReminderDBService;
    private line: LINEService;
    constructor(dbConfig: ClientConfig, lineConfig: LINEConfig) {
        this.db = new ReminderDBService(dbConfig);
        this.line = new LINEService(lineConfig);
    }

    public run = async () => {
        const dt: string = formatted(getRemindMomentJustBefore(moment()));
        await this.db.selectRemindTargets(dt)
            .then(rrs => {
                let targetUser = '';
                rrs.map(rr => {
                    if (rr.usr !== targetUser) {
                        targetUser = rr.usr;
                        this.line.sendMessage(rr.usr, 'リマインドをお知らせします。');
                    }
                    this.line.sendMessage(rr.usr, rr.cnt)
                        .then(() => this.db.sent(rr.id, rr.usr));
                });
            });
    }
}