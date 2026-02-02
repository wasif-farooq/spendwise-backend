import { IDatabase } from '../interfaces/IDatabase';
import { DatabaseAbstractFactory } from '../abstract-factories/DatabaseAbstractFactory';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';

export class DatabaseFacade {
    private database: IDatabase;

    constructor(private factory: DatabaseAbstractFactory) {
        this.database = this.factory.createDatabase();
    }

    async connect(): Promise<void> {
        await this.database.connect();
    }

    async disconnect(): Promise<void> {
        await this.database.disconnect();
    }

    async query(text: string, params?: any[]): Promise<any> {
        return this.database.query(text, params);
    }

    get raw() {
        return this.database;
    }
}
