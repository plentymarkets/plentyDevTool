import { LoginResponseInterface } from './loginResponse.interface';
import * as Factory from 'factory.ts';
import * as faker from 'faker';

export function loginResponseInterfaceFactory(): Factory.Factory<LoginResponseInterface> {
    return Factory.Sync.makeFactory<LoginResponseInterface>({
        accessToken: faker.datatype.uuid() + faker.datatype.uuid(),
        domain: 'http://master.plentymarkets.com',
        expiresIn: faker.datatype.number(),
        refreshToken: faker.datatype.uuid() + faker.datatype.uuid(),
        tokenType: 'Bearer'
    });
}
