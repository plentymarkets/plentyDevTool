import { PluginInterface } from './plugin.interface';
import * as faker from 'faker';
import { PluginSetInterface } from './pluginset.interface';
import { WebstoreInterface } from './webstore.interface';
import * as Factory from 'factory.ts';

export function pluginSetInterfaceFactory(): Factory.Factory<PluginSetInterface> {
    const plugins: Array<PluginInterface> = [];
    const webstores: Array<WebstoreInterface> = [];
    return Factory.Sync.makeFactory<PluginSetInterface>({
        id: faker.random.number(1, 500),
        name: faker.internet.domainWord(),
        plugins: plugins,
        webstores: webstores
    });
}
