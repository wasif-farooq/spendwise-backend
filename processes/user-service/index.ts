import { UserService } from '../../src/modules/users/service';

const service = new UserService();
service.start().catch((err) => {
    console.error('Fatal error starting User Service', err);
    process.exit(1);
});
