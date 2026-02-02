import { ServiceFactory } from './ServiceFactory';
import { UserController } from '@api/v1/modules/users/controllers/UserController';

export class UserControllerFactory {
    constructor(private serviceFactory: ServiceFactory) { }

    create(): UserController {
        return new UserController(this.serviceFactory.createUserService());
    }
}
