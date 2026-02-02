import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { User } from '../../models/User';
import knex from 'knex';

const qb = knex({ client: 'pg' });

/**
 * Query to update an existing User's details.
 */
export class UpdateUserQuery {
    constructor(private db: DatabaseFacade) { }

    /**
     * Executes the update query.
     * @param user The User entity with updated values.
     */
    async execute(user: User): Promise<void> {
        const { sql, bindings } = qb('users')
            .where({ id: user.id })
            .update({
                first_name: user.firstName,
                last_name: user.lastName,
                is_active: user.isActive,
                status: user.status,
                role: user.role,
                updated_at: new Date(),
                deleted_at: user.deletedAt
            })
            .toSQL().toNative();

        await this.db.query(sql, bindings as any[]);
    }
}
