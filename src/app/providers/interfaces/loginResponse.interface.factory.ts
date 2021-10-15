import { LoginResponseInterface } from './loginResponse.interface';
import * as Factory from 'factory.ts';
import * as faker from 'faker';

export function loginResponseInterfaceFactory(): Factory.Factory<LoginResponseInterface> {
    return Factory.Sync.makeFactory<LoginResponseInterface>({
        accessToken: faker.random.uuid() + faker.random.uuid(),
        domain: 'http://master.plentymarkets.com',
        expiresIn: faker.random.number(),
        refreshToken: faker.random.uuid() + faker.random.uuid(),
        tokenType: 'Bearer'
    });
}
