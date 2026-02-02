import { KafkaRequestReply } from '@messaging/implementations/kafka/KafkaRequestReply';
import { LoginDto, RegisterDto } from '@modules/auth/application/dto/auth.dto';

export class AuthRequestRepository {
    private rpcClient: KafkaRequestReply;

    constructor() {
        this.rpcClient = new KafkaRequestReply();
        // Ideally connect here or lazily
        this.rpcClient.connect().catch(err => console.error('Failed to connect RPC Client', err));
    }

    async login(dto: LoginDto) {
        return this.rpcClient.request('auth.service.login', dto);
    }

    async register(dto: RegisterDto) {
        return this.rpcClient.request('auth.service.register', dto);
    }
}
