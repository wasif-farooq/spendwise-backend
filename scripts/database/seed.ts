import { Client } from 'pg';
import { ConfigLoader } from '@core/config/ConfigLoader';

async function seed() {
    // Load Config
    const configLoader = ConfigLoader.getInstance();
    const dbConfig = configLoader.get('database.postgres');

    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        ssl: dbConfig.ssl
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Seeding Feature Flags...');

        const flags = [
            { key: 'new_dashboard_enabled', description: 'Enable the new dashboard layout' },
            { key: 'beta_features_enabled', description: 'Enable beta features for testing' },
            { key: 'dark_mode_default', description: 'Set dark mode as default for new users' }
        ];

        for (const flag of flags) {
            await client.query(`
                INSERT INTO feature_flags (key, description, is_enabled)
                VALUES ($1, $2, true)
                ON CONFLICT (key) DO UPDATE SET is_enabled = true;
            `, [flag.key, flag.description]);
        }

        console.log('Feature Flags seeded successfully.');

    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
