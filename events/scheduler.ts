import { LINEService } from '../services/lineConnectService';
import { ReminderDBService } from '../services/dbConnectService';
import { ReminderRow } from '../services/sql';
import moment from 'moment';

const mu = require('../utils/momentUtil');

export class SchedulerHandler {
    private db: ReminderDBService;
    private line: LINEService;
    constructor() {
        this.db = new ReminderDBService();
        this.line = new LINEService();
    }

    public run = async (): Promise<string> => {
        const dt: string = mu.formatted(
            mu.getRemindMomentJustBefore(moment()));
        let targets: ReminderRow[] = await this.db.selectRemindTargets(dt);
        let length = targets.length;
        if (length) {
            console.log(`[Scheduler.run]: The number of target reminders: ${length}`);
            return await Promise.all(
                targets.map(async (remind: ReminderRow) => {
                    await this.line.sendMessage(remind.usr, remind.cnt)
                        .then(() => this.db.sent(remind.id, remind.usr));
                })
            )
            .then(() => dt);
        } else {
            console.log('[Scheduler.run]: No target reminders.');
            return dt;
        }
    }
}