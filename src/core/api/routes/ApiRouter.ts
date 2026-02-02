import { Router } from 'express';
import authRoutesV1 from '../../../api/v1/modules/auth/routes/auth.routes';
import userRoutesV1 from '../../../api/v1/modules/users/routes/user.routes';

export class ApiRouter {
    private router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes() {
        // V1 Routes
        this.router.use('/v1/auth', authRoutesV1);
        this.router.use('/v1/users', userRoutesV1);

        // V2 Routes could go here
        // this.router.use('/v2/auth', authRoutesV2);
    }

    public getRouter(): Router {
        return this.router;
    }
}
