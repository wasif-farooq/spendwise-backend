import { Entity } from '../../../../api/shared/domain/entities/Entity';

export enum UserRole {
    CUSTOMER = 'customer',
    STAFF = 'staff',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface UserProps {
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean; // Deprecated in favor of status? keeping for compatibility unless asked to remove.
    status: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export class User extends Entity<UserProps> {
    private constructor(props: UserProps, id?: string) {
        super(props, id);
    }

    public static create(props: { email: string; firstName?: string; lastName?: string; role?: UserRole; status?: string }, id?: string): User {
        const userProps: UserProps = {
            ...props,
            isActive: true,
            status: props.status || 'active',
            role: props.role || UserRole.CUSTOMER,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null
        };
        return new User(userProps, id);
    }

    // Static restore method to rehydrate from DB without defaults
    public static restore(props: UserProps, id: string): User {
        return new User(props, id);
    }

    get email(): string { return this.props.email; }
    get firstName(): string | undefined { return this.props.firstName; }
    get lastName(): string | undefined { return this.props.lastName; }
    get isActive(): boolean { return this.props.isActive; }
    get role(): UserRole { return this.props.role; }
    get status(): string { return this.props.status; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get deletedAt(): Date | undefined | null { return this.props.deletedAt; }

    public updateName(firstName: string, lastName: string) {
        this.props.firstName = firstName;
        this.props.lastName = lastName;
        this.props.updatedAt = new Date();
    }

    public delete() {
        this.props.deletedAt = new Date();
        this.props.isActive = false;
        this.props.status = 'deleted';
    }
}
