import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
// import { IReadRepository } from '../contracts/IReadRepository';
// Assuming Repository pattern implementation details

export abstract class BaseRepository<T> {
    constructor(protected db: DatabaseFacade, protected tableName: string) { }

    async findAll(options?: { db?: DatabaseFacade }): Promise<T[]> {
        const db = options?.db || this.db;
        const result = await db.query(`SELECT * FROM ${this.tableName}`);
        return result.rows;
    }

    async findById(id: string, options?: { db?: DatabaseFacade }): Promise<T | null> {
        const db = options?.db || this.db;
        const result = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }

    async create(data: Partial<T>, options?: { db?: DatabaseFacade }): Promise<T> {
        const db = options?.db || this.db;
        // Simplified insertion logic
        const keys = Object.keys(data);
        const values = Object.values(data);
        const indices = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${indices}) RETURNING *`;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    async update(id: string, data: Partial<T>, options?: { db?: DatabaseFacade }): Promise<T> {
        const db = options?.db || this.db;
        const keys = Object.keys(data).filter(k => k !== 'id');
        const values = keys.map(k => (data as any)[k]);
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const query = `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;

        const result = await db.query(query, [id, ...values]);
        if (result.rowCount === 0) throw new Error('Entity not found');
        return result.rows[0];
    }

    async save(entity: any, options?: { db?: DatabaseFacade }): Promise<void> {
        const db = options?.db || this.db;
        const data = entity.props ? { ...entity.props } : { ...entity };
        const id = entity.id;

        // Check if exists
        const existing = await this.findById(id, { db });
        if (existing) {
            await this.update(id, data, { db });
        } else {
            if (id) (data as any).id = id;
            await this.create(data, { db });
        }
    }

    async delete(id: string, options?: { db?: DatabaseFacade }): Promise<boolean> {
        const db = options?.db || this.db;
        const result = await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}


