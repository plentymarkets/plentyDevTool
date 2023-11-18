import { PluginInterface } from './plugin.interface';
import { faker } from '@faker-js/faker';
import { PluginSetInterface } from './pluginset.interface';
import { WebstoreInterface } from './webstore.interface';
import * as Factory from 'factory.ts';

export function pluginSetInterfaceFactory(): Factory.Factory<PluginSetInterface> {
    const plugins: Array<PluginInterface> = [];
    const webstores: Array<WebstoreInterface> = [];
    return Factory.Sync.makeFactory<PluginSetInterface>({
        id: faker.datatype.number({min: 1, max: 500}).toString(),
        name: faker.internet.domainWord(),
        plugins: plugins,
        webstores: webstores
    });
}
