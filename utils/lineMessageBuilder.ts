import { MessageCommon, Message, QuickReplyItem, TextMessage, TemplateMessage, Action, TemplateColumn, TemplateImageColumn, FlexMessage, FlexContainer } from '@line/bot-sdk';

/**
 * Static class for line message contents to be used if not set.
 * The default message contents in this class can be modified,
 * but it's not the way it's supposed to be used,
 * and it's recommended that MessageBuilder be properly configured.
 */
export class DEFAULT_MESSAGE_CONTENT {
    static action: Action = {
        type: 'message',
        label: 'DEFAULT_ACTION',
        text: 'This is a default action. You maybe made a mistake in the Action settings.',
    };
    static templateColumn: TemplateColumn = {
        text: 'This is a default template column. You maybe made a mistake in the TemplateColumn settings.',
        actions: [this.action],
    };
    static templateImageColumn: TemplateImageColumn = {
        imageUrl: '#',
        action: this.action,
    };
    static flexContainer: FlexContainer = {
        type: 'bubble',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [{
                type: 'text',
                text: 'This is a default flex container. You maybe made a mistake in the FlexContainer settings.',
                wrap: true,
            }],
        }
    }
    private constructor(){}
}

export class MessageBuilder {
    private common: MessageCommon;
    constructor() {
        this.common = {};
    }

    public type(t: 'text'): TextMessageBuilder;
    public type(t: 'template'): TemplateMessageBuilder;
    public type(t: 'flex'): FlexMessageBuilder;

    public type(t: 'text'|'template'|'flex') {
        switch (t) {
            case 'text': return new TextMessageBuilder(this);
            case 'template': return new TemplateMessageBuilder(this);
            case 'flex': return new FlexMessageBuilder(this);
        }
    }
    public addQuickReply = (item: QuickReplyItem): this => {
        if (this.common.quickReply) {
            this.common.quickReply.items.push(item);
        } else {
            this.common.quickReply = {
                items: [item]
            }
        }
        return this;
    }
    public sender = (name?: string, iconUrl?: string): this => {
        if (name || iconUrl) {
            this.common.sender = {
                name: name,
                iconUrl: iconUrl,
            };
        }
        return this;
    }
    public getCommon = (): MessageCommon => {
        return this.common;
    }
}

declare interface Buildable<T extends Message> {
    build(forced?: false): T|null;
    build(forced: true): T;
}

declare interface MessageBufInterface {
    type: string;
}

class TextMessageBuf implements MessageBufInterface {
    type: 'text' = 'text';
    text: string = '';
}

class TemplateMessageBuf implements MessageBufInterface {
    type: 'template' = 'template';
    altText: string = '';
}

class TemplateButtonsMessageBuf implements MessageBufInterface {
    type: 'buttons' = 'buttons';
    text: string = '';
    actions?: Action[]; // required
    thumbnailImageUrl?: string;
    imageAspectRatio?: 'rectangle' | 'square';
    imageSize?: 'cover' | 'contain';
    imageBackgroundColor?: string;
    title?: string;
}

class TemplateConfirmMessageBuf implements MessageBufInterface {
    type: 'confirm' = 'confirm';
    text: string = '';
    actions?: Action[]; // required
}

class TemplateCarouselMessageBuf implements MessageBufInterface {
    type: 'carousel' = 'carousel';
    columns?: TemplateColumn[]; // required
    imageAspectRatio?: 'rectangle' | 'square';
    imageSize?: 'cover' | 'contain';
}

class TemplateImageCarouselMessageBuf implements MessageBufInterface {
    type: 'image_carousel' = 'image_carousel';
    columns?: TemplateImageColumn[]; // required
}

class FlexMessageBuf implements MessageBufInterface {
    type: 'flex' = 'flex';
    altText: string = '';
    contents?: FlexContainer; // required
}

abstract class ClassifiedMessageBuilderBase<T extends MessageBufInterface> {
    protected commonBuilder: MessageBuilder;
    protected buf: T;
    constructor(commonBuilder: MessageBuilder, Buf: (new () => T)) {
        this.commonBuilder = commonBuilder;
        this.buf = new Buf();
    }
    addQuickReply = (item: QuickReplyItem): this => {
        this.commonBuilder.addQuickReply(item);
        return this;
    }
    sender = (name?: string, iconUrl?: string): this => {
        this.commonBuilder.sender(name, iconUrl);
        return this;
    }
}

export class TextMessageBuilder extends ClassifiedMessageBuilderBase<TextMessageBuf> implements Buildable<TextMessage> {
    constructor(commonBuilder: MessageBuilder) {
        super(commonBuilder, TextMessageBuf);
    }

    public text = (text: string): this => {
        this.buf.text = text;
        return this;
    }
    public build = (): TextMessage => {
        const common: MessageCommon = this.commonBuilder.getCommon();
        return {
            type: this.buf.type,
            text: this.buf.text,
            quickReply: common.quickReply,
        };
    }
}

export class TemplateMessageBuilder extends ClassifiedMessageBuilderBase<TemplateMessageBuf> {
    constructor(commonBuilder: MessageBuilder) {
        super(commonBuilder, TemplateMessageBuf);
    }

    public altText = (altText: string): this => {
        this.buf.altText = altText;
        return this;
    }
    public getAltText = (): string => {
        return this.buf.altText;
    }
    get type(): 'template' {
        return this.buf.type;
    }

    public templateType(t: 'buttons'): TemplateButtonsMessageBuilder;
    public templateType(t: 'confirm'): TemplateConfirmMessageBuilder;
    public templateType(t: 'carousel'): TemplateCarouselMessageBuilder;
    public templateType(t: 'image_carousel'): TemplateImageCarouselMessageBuilder;

    public templateType(t: 'buttons'|'confirm'|'carousel'|'image_carousel') {
        switch (t) {
            case 'buttons': return new TemplateButtonsMessageBuilder(this.commonBuilder, this);
            case 'confirm': return new TemplateConfirmMessageBuilder(this.commonBuilder, this);
            case 'carousel': return new TemplateCarouselMessageBuilder(this.commonBuilder, this);
            case 'image_carousel': return new TemplateImageCarouselMessageBuilder(this.commonBuilder, this);
        }
    }
}

export class TemplateButtonsMessageBuilder extends ClassifiedMessageBuilderBase<TemplateButtonsMessageBuf> implements Buildable<TemplateMessage> {
    private templateMessageBuilder: TemplateMessageBuilder;
    constructor(commonBuilder: MessageBuilder, templateMessageBuilder: TemplateMessageBuilder) {
        super(commonBuilder, TemplateButtonsMessageBuf);
        this.templateMessageBuilder = templateMessageBuilder;
    }

    public text = (text: string): this => {
        this.buf.text = text;
        return this;
    }
    public thumbnailImageUrl = (thumbnailImageUrl: string): this => {
        this.buf.thumbnailImageUrl = thumbnailImageUrl;
        return this;
    }
    public imageAspectRatio = (imageAspectRatio: 'rectangle'|'square'): this => {
        this.buf.imageAspectRatio = imageAspectRatio;
        return this;
    }
    public imageSize = (imageSize: 'cover'|'contain'): this => {
        this.buf.imageSize = imageSize;
        return this;
    }
    public imageBackgroundColor = (imageBackgroundColor: string): this => {
        this.buf.imageBackgroundColor = imageBackgroundColor;
        return this;
    }
    public title = (title: string): this => {
        this.buf.title = title;
        return this;
    }
    public addAction = (action: Action): this => {
        if (this.buf.actions) {
            this.buf.actions.push(action);
        } else {
            this.buf.actions = [action];
        }
        return this;
    }

    public build(forced?: false): TemplateMessage|null;
    public build(forced: true): TemplateMessage;

    public build(forced?: Boolean) {
        const common: MessageCommon = this.commonBuilder.getCommon();
        const actions: Action[] = this.buf.actions || [DEFAULT_MESSAGE_CONTENT.action];
        const templateButtonsMessage: TemplateMessage = {
            type: this.templateMessageBuilder.type,
            altText: this.templateMessageBuilder.getAltText(),
            template: {
                type: this.buf.type,
                thumbnailImageUrl: this.buf.thumbnailImageUrl,
                imageAspectRatio: this.buf.imageAspectRatio,
                imageSize: this.buf.imageSize,
                imageBackgroundColor: this.buf.imageBackgroundColor,
                title: this.buf.title,
                text: this.buf.text,
                actions: actions,
            },
            quickReply: common.quickReply,
        };
        if (forced) {
            return templateButtonsMessage;
        } else {
            return this.buf.actions ? templateButtonsMessage : null;
        }
    }
}

export class TemplateConfirmMessageBuilder extends ClassifiedMessageBuilderBase<TemplateConfirmMessageBuf> implements Buildable<TemplateMessage> {
    private templateMessageBuilder: TemplateMessageBuilder;
    constructor(commonBuilder: MessageBuilder, templateMessageBuilder: TemplateMessageBuilder) {
        super(commonBuilder, TemplateConfirmMessageBuf);
        this.templateMessageBuilder = templateMessageBuilder;
    }

    public text = (text: string): this => {
        this.buf.text = text;
        return this;
    }
    public addAction = (action: Action): this => {
        if (this.buf.actions) {
            this.buf.actions.push(action);
        } else {
            this.buf.actions = [action];
        }
        return this;
    }

    public build(forced?: false): TemplateMessage|null;
    public build(forced: true): TemplateMessage;

    public build(forced?: Boolean) {
        const common: MessageCommon = this.commonBuilder.getCommon();
        const actions: Action[] = this.buf.actions || [DEFAULT_MESSAGE_CONTENT.action];
        const templateConfirmMessage: TemplateMessage = {
            type: this.templateMessageBuilder.type,
            altText: this.templateMessageBuilder.getAltText(),
            template: {
                type: this.buf.type,
                text: this.buf.text,
                actions: actions,
            },
            quickReply: common.quickReply,
        };
        if (forced) {
            return templateConfirmMessage;
        } else {
            return this.buf.actions ? templateConfirmMessage : null;
        }
    }
}

export class TemplateCarouselMessageBuilder extends ClassifiedMessageBuilderBase<TemplateCarouselMessageBuf> implements Buildable<TemplateMessage> {
    private templateMessageBuilder: TemplateMessageBuilder;
    constructor(commonBuilder: MessageBuilder, templateMessageBuilder: TemplateMessageBuilder) {
        super(commonBuilder, TemplateCarouselMessageBuf);
        this.templateMessageBuilder = templateMessageBuilder;
    }

    public addColumn = (column: TemplateColumn): this => {
        if (this.buf.columns) {
            this.buf.columns.push(column);
        } else {
            this.buf.columns = [column];
        }
        return this;
    }
    public imageAspectRatio = (imageAspectRatio: 'rectangle'|'square'): this => {
        this.buf.imageAspectRatio = imageAspectRatio;
        return this;
    }
    public imageSize = (imageSize: 'cover'|'contain'): this => {
        this.buf.imageSize = imageSize;
        return this;
    }

    public build(forced?: false): TemplateMessage|null;
    public build(forced: true): TemplateMessage;

    public build(forced?: Boolean) {
        const common: MessageCommon = this.commonBuilder.getCommon();
        const columns: TemplateColumn[] = this.buf.columns || [DEFAULT_MESSAGE_CONTENT.templateColumn];
        const templateCarouselMessage: TemplateMessage = {
            type: this.templateMessageBuilder.type,
            altText: this.templateMessageBuilder.getAltText(),
            template: {
                type: this.buf.type,
                columns: columns,
                imageAspectRatio: this.buf.imageAspectRatio,
                imageSize: this.buf.imageSize,
            },
            quickReply: common.quickReply,
        };
        if (forced) {
            return templateCarouselMessage;
        } else {
            return this.buf.columns ? templateCarouselMessage : null;
        }
    }
}

export class TemplateImageCarouselMessageBuilder extends ClassifiedMessageBuilderBase<TemplateImageCarouselMessageBuf> implements Buildable<TemplateMessage> {
    private templateMessageBuilder: TemplateMessageBuilder;
    constructor(commonBuilder: MessageBuilder, templateMessageBuilder: TemplateMessageBuilder) {
        super(commonBuilder, TemplateImageCarouselMessageBuf);
        this.templateMessageBuilder = templateMessageBuilder;
    }

    public addColumn = (column: TemplateImageColumn): this => {
        if (this.buf.columns) {
            this.buf.columns.push(column);
        } else {
            this.buf.columns = [column];
        }
        return this;
    }

    public build(forced?: false): TemplateMessage|null;
    public build(forced: true): TemplateMessage;

    public build(forced?: Boolean) {
        const common: MessageCommon = this.commonBuilder.getCommon();
        const columns: TemplateImageColumn[] = this.buf.columns || [DEFAULT_MESSAGE_CONTENT.templateImageColumn];
        const templateImageCarouselMessage: TemplateMessage = {
            type: this.templateMessageBuilder.type,
            altText: this.templateMessageBuilder.getAltText(),
            template: {
                type: this.buf.type,
                columns: columns,
            },
            quickReply: common.quickReply,
        };
        if (forced) {
            return templateImageCarouselMessage;
        } else {
            return this.buf.columns ? templateImageCarouselMessage : null;
        }
    }
}

export class FlexMessageBuilder extends ClassifiedMessageBuilderBase<FlexMessageBuf> implements Buildable<FlexMessage> {
    constructor(commonBuilder: MessageBuilder) {
        super(commonBuilder, FlexMessageBuf);
    }

    public altText = (altText: string): this => {
        this.buf.altText = altText;
        return this;
    }
    public contents = (contents: FlexContainer): this => {
        this.buf.contents = contents;
        return this;
    }

    public build(forced?: false): FlexMessage|null;
    public build(forced: true): FlexMessage;

    public build(forced?: Boolean) {
        const common: MessageCommon = this.commonBuilder.getCommon();
        const contents: FlexContainer = this.buf.contents || DEFAULT_MESSAGE_CONTENT.flexContainer;
        const flexMessage: FlexMessage = {
            type: this.buf.type,
            altText: this.buf.altText,
            contents: contents,
            quickReply: common.quickReply,
        };
        if (forced) {
            return flexMessage;
        } else {
            return this.buf.contents ? flexMessage : null;
        }
    }
}