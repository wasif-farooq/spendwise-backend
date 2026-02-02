import { IAuthRepository } from './IAuthRepository';
import { AuthIdentity } from '../models/AuthIdentity';
import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { FindAuthIdentityQuery } from '../queries/auth/FindAuthIdentityQuery';
import { CreateAuthIdentityQuery } from '../queries/auth/CreateAuthIdentityQuery';
import { UpdateAuthIdentityQuery } from '../queries/auth/UpdateAuthIdentityQuery';

export class AuthRepository extends BaseRepository<any> implements IAuthRepository {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'auth_identities');
    }

    async save(identity: AuthIdentity): Promise<void> {
        // Upsert logic simplified by checking existence using the query class
        // In a high-concurrency real app, prefer ON CONFLICT DO UPDATE
        const finder = new FindAuthIdentityQuery(this.db);
        const exists = await finder.byId(identity.id);

        if (exists) {
            await new UpdateAuthIdentityQuery(this.db).execute(identity);
        } else {
            await new CreateAuthIdentityQuery(this.db).execute(identity);
        }
    }

    async findByUserIdAndProvider(userId: string, provider: string): Promise<AuthIdentity | null> {
        return new FindAuthIdentityQuery(this.db).byUserIdAndProvider(userId, provider);
    }

    async findByProviderAndSub(provider: string, sub: string): Promise<AuthIdentity | null> {
        return new FindAuthIdentityQuery(this.db).byProviderAndSub(provider, sub);
    }
}
