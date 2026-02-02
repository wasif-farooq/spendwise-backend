import { ServiceFactory } from './ServiceFactory';
import { AuthController } from '@api/v1/modules/auth/controllers/AuthController';

import { AuthRequestRepository } from '@api/v1/modules/auth/repositories/AuthRequestRepository';

export class AuthControllerFactory {
    constructor(private serviceFactory: ServiceFactory) { }

    create(): AuthController {
        return new AuthController(new AuthRequestRepository());
    }
}
