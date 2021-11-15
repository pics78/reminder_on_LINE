import { LINEConnector } from '../../connectors';
import { Query, ReminderRow } from '../../services';
import { MessageBuilder } from '../../utils/lineMessageBuilder';
import { RemindDt, PrintDt } from '../../utils/momentUtil';

const line = new LINEConnector();
const query = new Query();
const builder = new MessageBuilder();

export class SchedulerHandler {
    private constructor() {}

    static run = async (): Promise<string> => {
        const dt: string = PrintDt.toDB(RemindDt.prev());
        let targets: ReminderRow[] = await query.selectRemindTargets(dt);
        let length = targets.length;
        if (length) {
            console.log(`[Scheduler.run]: The number of target reminders: ${length}`);
            return await Promise.all(
                targets.map(async (remind: ReminderRow) => {
                    await line.sendMessage(remind.usr, builder.type('text')
                        .text(remind.cnt)
                        .build()
                    )
                    .then(() => query.sent(remind.id, remind.usr));
                })
            )
            .then(() => dt);
        } else {
            console.log('[Scheduler.run]: No target reminders.');
            return dt;
        }
    }
}