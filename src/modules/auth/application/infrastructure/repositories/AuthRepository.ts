import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { AuthIdentity } from '../../../domain/models/AuthIdentity';
import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';

export class AuthRepository extends BaseRepository<any> implements IAuthRepository {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'auth_identities');
    }

    async save(identity: AuthIdentity): Promise<void> {
        // Upsert logic simplified
        // Check if exists by ID
        const res = await this.db.query(`SELECT 1 FROM auth_identities WHERE id = $1`, [identity.id]);

        if (res.rows.length > 0) {
            await this.db.query(
                `UPDATE auth_identities SET password_hash = $1, last_login_at = $2 WHERE id = $3`,
                [identity.passwordHash, identity.getProps().lastLoginAt, identity.id]
            );
        } else {
            await this.db.query(
                `INSERT INTO auth_identities (id, user_id, provider, sub, password_hash, created_at, last_login_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [identity.id, identity.userId, identity.provider, identity.getProps().sub, identity.passwordHash, new Date(), identity.getProps().lastLoginAt]
            );
        }
    }

    async findByUserIdAndProvider(userId: string, provider: string): Promise<AuthIdentity | null> {
        const res = await this.db.query(`SELECT * FROM auth_identities WHERE user_id = $1 AND provider = $2`, [userId, provider]);
        if (res.rows.length === 0) return null;
        return this.mapToDomain(res.rows[0]);
    }

    async findByProviderAndSub(provider: string, sub: string): Promise<AuthIdentity | null> {
        const res = await this.db.query(`SELECT * FROM auth_identities WHERE provider = $1 AND sub = $2`, [provider, sub]);
        if (res.rows.length === 0) return null;
        return this.mapToDomain(res.rows[0]);
    }

    private mapToDomain(row: any): AuthIdentity {
        return AuthIdentity.create({
            userId: row.user_id,
            provider: row.provider,
            sub: row.sub,
            passwordHash: row.password_hash,
            lastLoginAt: row.last_login_at
        }, row.id);
    }
}
