import { IMessageQueue } from '@core/application/interfaces/IMessageQueue';
import { MessageQueueAbstractFactory } from '../abstract-factories/MessageQueueAbstractFactory';

export class MessagingFacade {
    private queue: IMessageQueue;

    constructor(private factory: MessageQueueAbstractFactory) {
        this.queue = this.factory.createMessageQueue();
    }

    async connect(): Promise<void> {
        await this.queue.connect();
    }

    async publish(topic: string, message: any): Promise<void> {
        await this.queue.publish(topic, message);
    }

    async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
        await this.queue.subscribe(topic, handler);
    }
}
