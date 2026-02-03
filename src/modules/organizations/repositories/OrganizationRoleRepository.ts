import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { OrganizationRole } from '../models/OrganizationRole';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';

export class OrganizationRoleRepository extends BaseRepository<OrganizationRole> {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'organization_roles');
    }
    async findByNameAndOrg(name: string, organizationId: string): Promise<OrganizationRole | null> {
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE name = $1 AND organization_id = $2 LIMIT 1`,
            [name, organizationId]
        );
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async findByIds(ids: string[]): Promise<OrganizationRole[]> {
        if (ids.length === 0) return [];
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE id = ANY($1)`,
            [ids]
        );
        return result.rows.map((row: any) => this.mapToEntity(row));
    }

    async findByOrg(organizationId: string): Promise<OrganizationRole[]> {
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return result.rows.map((row: any) => this.mapToEntity(row));
    }

    protected mapToEntity(row: any): OrganizationRole {
        return OrganizationRole.restore(
            {
                name: row.name,
                description: row.description,
                organizationId: row.organization_id,
                permissions: row.permissions,
                isSystem: row.is_system,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            },
            row.id
        );
    }
}

