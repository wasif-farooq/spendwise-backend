import { Entity } from '@api/shared/domain/entities/Entity';

export interface OrganizationProps {
    name: string;
    slug: string;
    ownerId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class Organization extends Entity<OrganizationProps> {
    private constructor(props: OrganizationProps, id?: string) {
        super(props, id);
    }

    public static create(props: { name: string; slug: string; ownerId?: string }, id?: string): Organization {
        const orgProps: OrganizationProps = {
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return new Organization(orgProps, id);
    }

    get name(): string { return this.props.name; }
    get slug(): string { return this.props.slug; }
    get ownerId(): string | undefined { return this.props.ownerId; }
}
