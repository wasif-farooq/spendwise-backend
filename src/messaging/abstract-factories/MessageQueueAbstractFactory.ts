import { IMessageQueue } from '../../core/application/interfaces/IMessageQueue';

export abstract class MessageQueueAbstractFactory {
    abstract createMessageQueue(): IMessageQueue;
}
