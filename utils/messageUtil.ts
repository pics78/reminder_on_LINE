import { load } from 'js-yaml';
import { readFileSync } from 'fs';

export declare type MessageType = {
    menu: {
        start: string,
        list: string,
    },
    postback: {
        data: {
            set: {
                dt: string,
                rgxToIgnore: string,
            },
            mdf: {
                rgx: string,
                cnt: string,
                dt: string,
            },
            cfm: {
                cnt: string,
                dt: string,
            },
            rty: {
                cnt: string,
                dt: string,
            },
            dlt: {
                rgx: string,
            },
            back: string,
            cancel: string,
        }
    }
}

module.exports = (load(readFileSync('./messages.yaml', 'utf8')) as MessageType);