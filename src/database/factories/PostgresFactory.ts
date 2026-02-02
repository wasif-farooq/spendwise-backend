import { DatabaseAbstractFactory } from '@core/application/abstract-factories/DatabaseAbstractFactory';
import { IDatabase } from '@core/application/interfaces/IDatabase';
import { Pool } from 'pg';
import { ConfigLoader } from '@core/config/ConfigLoader';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { ILogger } from '@core/application/interfaces/ILogger';

// Detailed Implementation could be in a separate file, but checking prompt structure, 
// implementation is likely under 'src/database/impl...' or similar.
// For factory simplicity, defining a simple class here or creating one.
// Let's create a PostgresDatabase class inside this factory file or separate if needed.
// Given strict file structure, let's implement the factory to return a PostgresDatabase instance.

class PostgresDatabase implements IDatabase {
    private pool: Pool;
    private connected: boolean = false;

    constructor(private config: any, private logger: ILogger) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl,
            min: config.pool.min,
            max: config.pool.max
        });

        this.pool.on('error', (err) => {
            this.logger.error('Unexpected error on idle client', err.message);
            this.connected = false;
        });
    }

    async connect(): Promise<void> {
        const client = await this.pool.connect();
        client.release();
        this.connected = true;
        this.logger.info('Successfully connected to PostgreSQL');
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
        this.connected = false;
        this.logger.info('Disconnected from PostgreSQL');
    }

    async query(text: string, params?: any[]): Promise<any> {
        return this.pool.query(text, params);
    }

    isConnected(): boolean {
        return this.connected;
    }
}

export class PostgresFactory extends DatabaseAbstractFactory {
    // We can create instances based on logic

    createDatabase(): IDatabase {
        const config = ConfigLoader.getInstance();
        const dbConfig = config.get('database.postgres');
        // Using a logger would require dependency resolution or passing it in
        // For now, let's assume a basic console fallback or resolve via Container if strict
        // But Factory usually creates.
        // Let's assume console for simplicity inside this factory unless we inject logger factory.

        // Quick Fix: simple console logger proxy
        const logger: ILogger = {
            debug: console.debug,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        return new PostgresDatabase(dbConfig, logger);
    }
}
