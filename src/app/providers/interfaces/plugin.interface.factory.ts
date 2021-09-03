import * as faker from 'faker';
import { PluginInterface } from './plugin.interface';
import * as Factory from 'factory.ts';

export function pluginInterfaceFactory(): Factory.Factory<PluginInterface> {
    return Factory.Sync.makeFactory<PluginInterface>({
        activeProductive: faker.random.boolean(),
        id: faker.random.number(1, 500),
        installed: faker.random.boolean(),
        isClosedSource: faker.random.boolean(),
        isConnectedWithGit: faker.random.boolean(),
        name: faker.internet.domainWord(),
        source: faker.random.arrayElement('git', 'marketplace', 'local'),
        version: faker.system.semver
    });
}
