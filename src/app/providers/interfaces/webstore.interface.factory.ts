import { WebstoreInterface } from './webstore.interface';
import * as faker from 'faker';
import * as Factory from 'factory.ts';

export function webstoreInterfaceFactory(): Factory.Factory<WebstoreInterface> {
    return Factory.Sync.makeFactory<WebstoreInterface>({
        id: Factory.each(i => i),
        name: faker.internet.domainWord()
    });
}
