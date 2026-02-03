import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { OrganizationMember } from '../models/OrganizationMember';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';

export class OrganizationMembersRepository extends BaseRepository<OrganizationMember> {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'organization_members');
    }

    protected mapToEntity(row: any): OrganizationMember {
        return OrganizationMember.restore({
            userId: row.user_id,
            organizationId: row.organization_id,
            roleId: row.role_id,
            joinedAt: row.joined_at
        }, row.id);
    }

    async findByUserAndOrg(userId: string, organizationId: string): Promise<OrganizationMember | null> {
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2 LIMIT 1`,
            [userId, organizationId]
        );
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async findByUserId(userId: string): Promise<OrganizationMember[]> {
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1`,
            [userId]
        );
        return result.rows.map((row: any) => this.mapToEntity(row));
    }

    async findByOrganizationId(organizationId: string): Promise<OrganizationMember[]> {
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return result.rows.map((row: any) => this.mapToEntity(row));
    }

    async countByRole(roleId: string): Promise<number> {
        const result = await this.db.query(
            `SELECT COUNT(*) as count FROM ${this.tableName} WHERE role_id = $1`,
            [roleId]
        );
        return result.rows[0] ? Number(result.rows[0].count) : 0;
    }

    async findAllWithDetails(organizationId: string): Promise<any[]> {
        const query = `
            SELECT 
                om.id as member_id,
                om.user_id,
                om.organization_id,
                om.joined_at,
                u.first_name,
                u.last_name,
                u.email,
                org_roles.name as role_name,
                om.role_id
            FROM ${this.tableName} om
            JOIN users u ON om.user_id = u.id
            LEFT JOIN organization_roles org_roles ON om.role_id = org_roles.id
            WHERE om.organization_id = $1
        `;
        const result = await this.db.query(query, [organizationId]);
        return result.rows.map((row: any) => ({
            id: row.member_id,
            userId: row.user_id,
            organizationId: row.organization_id,
            roleId: row.role_id,
            roleName: row.role_name,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            joinedAt: row.joined_at
        }));
    }
}
