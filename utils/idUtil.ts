import uuid from 'node-uuid';

export const getId = (): string => {
    return uuid.v1(); // 時刻とMACアドレスを元に36文字のuuidを生成
}