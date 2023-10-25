import { faker } from '@faker-js/faker';
import { PluginInterface } from './plugin.interface';
import * as Factory from 'factory.ts';

export function pluginInterfaceFactory(): Factory.Factory<PluginInterface> {
    return Factory.Sync.makeFactory<PluginInterface>({
        activeProductive: faker.datatype.boolean(),
        id: faker.datatype.number({min: 1, max: 500}),
        installed: faker.datatype.boolean(),
        isClosedSource: faker.datatype.boolean(),
        isConnectedWithGit: faker.datatype.boolean(),
        name: faker.internet.domainWord(),
        source: faker.helpers.arrayElement(['git', 'marketplace', 'local']),
        version: faker.system.semver()
    });
}
