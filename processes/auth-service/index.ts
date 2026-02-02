import { AuthService } from '../../src/modules/auth/service';

const service = new AuthService();
service.start().catch((err) => {
    console.error('Fatal error starting Auth Service', err);
    process.exit(1);
});
