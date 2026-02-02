import { User } from '../models/User';

export class UserMapper {
    public static toDomain(row: any): User {
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
