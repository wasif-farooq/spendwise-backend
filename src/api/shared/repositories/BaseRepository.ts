import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
// import { IReadRepository } from '../contracts/IReadRepository';
// Assuming Repository pattern implementation details

export abstract class BaseRepository<T> {
    constructor(protected db: DatabaseFacade, protected tableName: string) { }

    async findAll(): Promise<T[]> {
        const result = await this.db.query(`SELECT * FROM ${this.tableName}`);
        return result.rows;
    }

    async findById(id: string): Promise<T | null> {
        const result = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }

    async create(data: Partial<T>): Promise<T> {
        // Simplified insertion logic
        const keys = Object.keys(data);
        const values = Object.values(data);
        const indices = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${indices}) RETURNING *`;

        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
