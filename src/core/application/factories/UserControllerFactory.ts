import { ServiceFactory } from './ServiceFactory';
import { UserRequestRepository } from '@api/v1/modules/users/repositories/UserRequestRepository';
import { UserController } from '@api/v1/modules/users/controllers/UserController';

export class UserControllerFactory {
    constructor(private serviceFactory: ServiceFactory) { }

    create(repository?: UserRequestRepository): UserController {
        return new UserController(repository || new UserRequestRepository());
    }
}
