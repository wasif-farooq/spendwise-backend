import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { User } from '../../../../domain/models/User';
import knex from 'knex';

const qb = knex({ client: 'pg' });

/**
 * Query to insert a new User into the database.
 */
export class CreateUserQuery {
    constructor(private db: DatabaseFacade) { }

    /**
     * Executes the insert query.
     * @param user The User entity to persist.
     */
    async execute(user: User): Promise<void> {
        const { sql, bindings } = qb('users').insert({
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            is_active: user.isActive,
            status: user.status,
            role: user.role,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
            deleted_at: user.deletedAt
        }).toSQL().toNative();

        await this.db.query(sql, bindings as any[]);
    }
}
