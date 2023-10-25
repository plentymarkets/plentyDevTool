import * as Factory from 'factory.ts';
import { faker } from '@faker-js/faker';
import { LoginDataInterface } from './loginData.interface';

export function loginDataInterfaceFactory(): Factory.Factory<
    LoginDataInterface
    > {
    return Factory.Sync.makeFactory<LoginDataInterface>({
        id: String(faker.datatype.number({ min: 1, max: 1000 })),
        accessToken: faker.datatype.uuid() + faker.datatype.uuid(),
        domain: 'http://master.plentymarkets.com',
        syncPath: null,
        syncSelection: '[]',
    });
}
