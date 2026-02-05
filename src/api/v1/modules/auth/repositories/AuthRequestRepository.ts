import { KafkaRequestReply } from '@messaging/implementations/kafka/KafkaRequestReply';
import { LoginDto, RegisterDto } from '@modules/auth/dto/auth.dto';

export class AuthRequestRepository {
    private rpcClient: KafkaRequestReply;

    constructor(autoConnect: boolean = true) {
        this.rpcClient = new KafkaRequestReply();
        if (autoConnect) {
            this.rpcClient.connect().catch(err => console.error('Failed to connect RPC Client', err));
        }
    }

    async login(dto: LoginDto) {
        return this.rpcClient.request('auth.service.login', dto);
    }

    async register(dto: RegisterDto) {
        return this.rpcClient.request('auth.service.register', dto);
    }

    async verify2FA(dto: any) {
        return this.rpcClient.request('auth.service.verify-2fa', dto);
    }

    async resend2FA(dto: any) {
        return this.rpcClient.request('auth.service.resend-2fa', dto);
    }

    async verifyBackupCode(dto: any) {
        return this.rpcClient.request('auth.service.verify-backup-code', dto);
    }

    async forgotPassword(dto: any) {
        return this.rpcClient.request('auth.service.forgot-password', dto);
    }

    async verifyResetCode(dto: any) {
        return this.rpcClient.request('auth.service.verify-reset-code', dto);
    }

    async resetPassword(dto: any) {
        return this.rpcClient.request('auth.service.reset-password', dto);
    }

    async verifyEmail(dto: { email: string, code: string }) {
        return this.rpcClient.request('auth.service.verify-email', dto);
    }

    async getMe(userId: string) {
        return this.rpcClient.request('auth.service.get-me', { userId });
    }

    async refresh(dto: { refreshToken: string }) {
        return this.rpcClient.request('auth.service.refresh', dto);
    }
}
