import { CredentialsInterface } from './credentials.interface';
import * as Factory from 'factory.ts';
import { faker } from '@faker-js/faker';

export function credentialsInterfaceFactory(): Factory.Factory<
    CredentialsInterface
    > {
    return Factory.Sync.makeFactory<CredentialsInterface>({
        plentyId: String(faker.datatype.number({ min: 1, max: 1000 })),
        username: faker.internet.userName(),
        password: faker.internet.password(),
        domain: 'https://plentymarkets-cloud-de.com/rest/login',
    });
}
