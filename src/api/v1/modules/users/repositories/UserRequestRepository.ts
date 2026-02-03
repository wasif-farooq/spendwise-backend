import { KafkaRequestReply } from '@messaging/implementations/kafka/KafkaRequestReply';

export class UserRequestRepository {
    private rpcClient: KafkaRequestReply;

    constructor(autoConnect: boolean = true) {
        this.rpcClient = new KafkaRequestReply();
        if (autoConnect) {
            this.rpcClient.connect().catch(err => console.error('Failed to connect RPC Client', err));
        }
    }

    async getProfile(userId: string) {
        return this.rpcClient.request('user.service.getProfile', { userId });
    }

    async updateProfile(userId: string, data: any) {
        return this.rpcClient.request('user.service.updateProfile', { userId, ...data });
    }
}
