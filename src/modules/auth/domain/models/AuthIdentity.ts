import { Entity } from '../../../../api/shared/domain/entities/Entity';

export interface AuthIdentityProps {
    userId: string;
    provider: 'local' | 'google' | 'apple';
    sub?: string; // Subject identifier or email
    passwordHash?: string;
    lastLoginAt?: Date;
}

export class AuthIdentity extends Entity<AuthIdentityProps> {
    private constructor(props: AuthIdentityProps, id?: string) {
        super(props, id);
    }

    public static create(props: AuthIdentityProps, id?: string): AuthIdentity {
        return new AuthIdentity(props, id);
    }

    get userId(): string { return this.props.userId; }
    get provider(): string { return this.props.provider; }
    get passwordHash(): string | undefined { return this.props.passwordHash; }

    public updateLastLogin() {
        this.props.lastLoginAt = new Date();
    }
}
