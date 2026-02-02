import { AuthIdentity } from '../models/AuthIdentity';

export interface IAuthRepository {
    save(identity: AuthIdentity): Promise<void>;
    findByUserIdAndProvider(userId: string, provider: string): Promise<AuthIdentity | null>;
    findByProviderAndSub(provider: string, sub: string): Promise<AuthIdentity | null>;
}
