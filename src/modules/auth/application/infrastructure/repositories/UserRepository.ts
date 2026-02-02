import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/models/User';
import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';

export class UserRepository extends BaseRepository<any> implements IUserRepository {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'users');
    }

    async save(user: User): Promise<void> {
        const exists = await this.findById(user.id);
        if (exists) {
            // Update
            await this.db.query(
                `UPDATE users SET first_name = $1, last_name = $2, is_active = $3, status = $4, role = $5, updated_at = $6, deleted_at = $7 WHERE id = $8`,
                [user.firstName, user.lastName, user.isActive, user.status, user.role, new Date(), user.deletedAt, user.id]
            );
        } else {
            // Insert
            await this.db.query(
                `INSERT INTO users (id, email, first_name, last_name, is_active, status, role, created_at, updated_at, deleted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [user.id, user.email, user.firstName, user.lastName, user.isActive, user.status, user.role, user.createdAt, user.updatedAt, user.deletedAt]
            );
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        const res = await this.db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        if (res.rows.length === 0) return null;
        return this.mapToDomain(res.rows[0]);
    }

    async findById(id: string): Promise<User | null> {
        const res = await this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
        if (res.rows.length === 0) return null;
        return this.mapToDomain(res.rows[0]);
    }

    private mapToDomain(row: any): User {
        return User.restore({
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            isActive: row.is_active,
            status: row.status || 'active',
            role: row.role || 'customer',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        }, row.id);
    }
}
