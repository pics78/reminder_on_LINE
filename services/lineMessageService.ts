import { QuickReplyItem, Action, FlexBubble, FlexComponent } from '@line/bot-sdk';
import { RemindDt, PrintDt } from '../utils/momentUtil';

export class LINEMessage {
    constructor() {}

    public setDatetimeAction = (): Action => {
        const minDatetime: string = PrintDt.toDB(RemindDt.next());
        return {
            type: 'datetimepicker',
            label: '選択',
            data: `action=set_remind_datetime`,
            mode: 'datetime',
            min: minDatetime,
        };
    }

    public quickReplyItem = (type: 'back'|'cancel'): QuickReplyItem => {
        const isBackType = type === 'back';
        return {
            type: 'action',
            action: {
                type: 'postback',
                label: isBackType ? '内容入力に戻る' : '中断する',
                text: isBackType ? '$back' : '$cancel',
                data: isBackType ? 'action=back': 'action=cancel',
            }
        };
    }

    public bubbleForList = (n: number, reminderId: string, content: string, datetime: string): FlexBubble => {
        return {
            "type": "bubble",
            "header": {
            "type": "box",
            "layout": "horizontal",
            "contents": [
                {
                "type": "text",
                "text": "登録リマインダ一覧",
                "weight": "bold",
                "size": "md",
                "flex": 3
                },
                {
                "type": "text",
                "text": `(${n}/12)`,
                "size": "xs",
                "weight": "bold",
                "align": "end",
                "flex": 1
                }
            ],
            "backgroundColor": "#00FF7F",
            "alignItems": "flex-end"
            },
            "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "内容",
                                    "size": "sm",
                                    "color": "#00CB32",
                                    "weight": "bold",
                                    "decoration": "underline",
                                    "offsetBottom": "md"
                                },
                                {
                                    "type": "text",
                                    "text": `${content}`,
                                    "size": "sm",
                                    "color": "#111111",
                                    "align": "start",
                                    "wrap": true
                                }
                            ],
                            "position": "relative",
                            "paddingTop": "xxl"
                        },
                        {
                            "type": "separator",
                            "margin": "md",
                            "color": "#B2B2B2"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "日時",
                                    "size": "sm",
                                    "color": "#00CB32",
                                    "weight": "bold",
                                    "decoration": "underline",
                                    "offsetBottom": "md"
                                },
                                {
                                    "type": "text",
                                    "text": `${datetime}`,
                                    "size": "sm",
                                    "color": "#111111",
                                    "align": "center"
                                }
                            ],
                            "position": "relative",
                            "margin": "xs",
                            "paddingTop": "xxl"
                        }
                    ]
                }
            ],
            "paddingTop": "xs"
            },
            "footer": {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                    "type": "button",
                    "action": {
                        "type": "postback",
                        "label": "編集",
                        "data": `action=modify&id=${reminderId}`,
                        "displayText": "$modify"
                    },
                    "position": "relative",
                    "color": "#00CB00"
                    },
                    {
                    "type": "separator",
                    "color": "#B2B2B2"
                    },
                    {
                    "type": "button",
                    "action": {
                        "type": "postback",
                        "label": "削除",
                        "data": `action=delete&id=${reminderId}`,
                        "displayText": "$delete"
                    },
                    "position": "relative",
                    "color": "#00BFFF"
                    }
                ]
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            } 
        };
    }

    public bubbleToModifyContent = (content: string): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "以下のリマインド内容を編集します。",
                        "weight": "bold",
                        "size": "xxs"
                    },
                    {
                        "type": "text",
                        "text": "新しい内容を入力してください。",
                        "size": "xxs",
                        "weight": "bold"
                    }
                ],
                "backgroundColor": "#00FF7F",
                "alignItems": "flex-start"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "内容",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${content}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "start",
                                        "wrap": true
                                    }
                                ],
                                "position": "relative",
                                "paddingTop": "xxl"
                            }
                        ]
                    }
                ],
                "paddingTop": "xs"
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }

    public bubbleToModifyDatetime = (datetime: string, minDatetime: string, retryFlg: Boolean = false): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": ((): FlexComponent[] =>
                    !retryFlg ?
                        [
                            {
                                "type": "text",
                                "text": "以下のリマインド日時を編集します。",
                                "weight": "bold",
                                "size": "xxs"
                            },
                            {
                                "type": "text",
                                "text": "新しい日時を選択してください。",
                                "size": "xxs",
                                "weight": "bold"
                            }
                        ]
                    :
                        [
                            {
                                "type": "text",
                                "text": "もう一度入力してください。",
                                "weight": "bold",
                                "size": "xxs"
                            }
                        ]
                )(),
                "backgroundColor": "#00FF7F",
                "alignItems": "flex-start"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "日時",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": datetime,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "center"
                                    }
                                ],
                                "position": "relative",
                                "paddingTop": "xxl"
                            }
                        ]
                    }
                ],
                "paddingTop": "xs"
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "datetimepicker",
                            "label": "選択",
                            "data": "action=modify_remind_datetime",
                            "mode": "datetime",
                            "min": minDatetime
                        }
                    }
                ]
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }

    public bubbleToConfirmContent = (content: string, newContent: string): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "text",
                    "text": "以下のように変更します。",
                    "weight": "bold",
                    "size": "xxs"
                },
                {
                    "type": "text",
                    "text": "問題なければ決定を押してください。",
                    "size": "xxs",
                    "weight": "bold"
                }
            ],
            "backgroundColor": "#00FF7F"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "内容",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${content}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "start",
                                        "wrap": true
                                    }
                                ],
                                "position": "relative",
                                "paddingTop": "xxl"
                            },
                            {
                                "type": "separator",
                                "margin": "md",
                                "color": "#B2B2B2"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "新しい内容",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${newContent}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "start",
                                        "wrap": true
                                    }
                                ],
                                "position": "relative",
                                "margin": "xs",
                                "paddingTop": "xxl"
                            }
                        ]
                    }
                ],
                "paddingTop": "xs"
            },
            "footer": {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "決定",
                            "data": "action=confirm_content",
                            "displayText": "$confirm"
                        },
                        "position": "relative",
                        "color": "#00CB00"
                    },
                    {
                        "type": "separator",
                        "color": "#B2B2B2"
                    },
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "やり直す",
                            "data": "action=retry_content",
                            "displayText": "$retry"
                        },
                        "position": "relative",
                        "color": "#00BFFF"
                    }
                ]
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }

    public bubbleToConfirmDatetime = (datetime: string, newDatetime: string): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "以下のように変更します。",
                        "weight": "bold",
                        "size": "xxs"
                    },
                    {
                        "type": "text",
                        "text": "問題なければ決定を押してください。",
                        "size": "xxs",
                        "weight": "bold"
                    }
                ],
                "backgroundColor": "#00FF7F"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "日時",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${datetime}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "center"
                                    }
                                ],
                                "position": "relative",
                                "paddingTop": "xxl"
                            },
                            {
                                "type": "separator",
                                "margin": "md",
                                "color": "#B2B2B2"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "新しい日時",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${newDatetime}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "center"
                                    }
                                ],
                                "position": "relative",
                                "margin": "xs",
                                "paddingTop": "xxl"
                            }
                        ]
                    }
                ],
                "paddingTop": "xs"
            },
            "footer": {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "決定",
                            "data": "action=confirm_datetime",
                            "displayText": "$confirm"
                        },
                        "position": "relative",
                        "color": "#00CB00"
                    },
                    {
                        "type": "separator",
                        "color": "#B2B2B2"
                    },
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "やり直す",
                            "data": "action=retry_datetime",
                            "displayText": "$retry"
                        },
                        "position": "relative",
                        "color": "#00BFFF"
                    }
                ]
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }

    public bubbleToCreateRemind = (content: string, datetime: string): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "リマインダを設定しました。",
                        "weight": "bold",
                        "size": "xxs"
                    }
                ],
                "backgroundColor": "#00FF7F"
            },
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "内容",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${content}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "start",
                                        "wrap": true
                                    }
                                ],
                                "position": "relative",
                                "paddingTop": "xxl"
                            },
                            {
                                "type": "separator",
                                "margin": "md",
                                "color": "#B2B2B2"
                            },
                            {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "text": "日時",
                                        "size": "sm",
                                        "color": "#00CB32",
                                        "weight": "bold",
                                        "decoration": "underline",
                                        "offsetBottom": "md"
                                    },
                                    {
                                        "type": "text",
                                        "text": `${datetime}`,
                                        "size": "sm",
                                        "color": "#111111",
                                        "align": "center"
                                    }
                                ],
                                "position": "relative",
                                "margin": "xs",
                                "paddingTop": "xxl"
                            }
                        ]
                    }
                ],
                "paddingTop": "xs"
            },
            "styles": {
                "header": {
                    "separator": true,
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }

    public bubbleToSelect = (): FlexBubble => {
        return {
            "type": "bubble",
            "size": "kilo",
            "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "どちらを編集しますか。",
                        "weight": "bold",
                        "size": "xxs"
                    }
                ],
                "backgroundColor": "#00FF7F"
            },
            "body": {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "内容",
                            "data": "action=modify_content",
                            "displayText": "$modify_content"
                        }
                    },
                    {
                        "type": "separator"
                    },
                    {
                        "type": "button",
                        "action": {
                            "type": "postback",
                            "label": "日時",
                            "data": "action=modify_datetime",
                            "displayText": "$modify_datetime"
                        }
                    }
                ],
                "paddingAll": "xs"
            },
            "styles": {
                "header": {
                    "backgroundColor": "#E5E5E5"
                },
                "footer": {
                    "separator": true
                }
            }
        };
    }
}