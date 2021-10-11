import { LINEConfig, LINEService } from '../services/lineConnectService';
import { StatusDef } from '../services/statusService';

export const ErrorType = {
    unexpectedStatus: 'unexpectedStatus',
}

export class ReminderErrorHandler {
    private line: LINEService;
    constructor(config: LINEConfig) {
        this.line = new LINEService(config);
    }

    public handleError = async (type: string, token: string, userId?: string, status?: string, expectedStatus?: string) => {
        switch (type) {
            case ErrorType.unexpectedStatus:
                console.error(`unexpected status: ${status}, expected: ${expectedStatus} (user: ${userId})`);
                switch (expectedStatus) {
                    case StatusDef.settingContent:
                        this.line.replyText(token, 'リマインド内容入力状態ではありません');
                        break;
                    case StatusDef.settingDatetime:
                        this.line.replyText(token, 'リマインド日時入力状態ではありません');
                        break;
                    default:
                        this.line.replyText(token, '予期せぬエラーが発生しました');
                }
                break;
        }
    }
}