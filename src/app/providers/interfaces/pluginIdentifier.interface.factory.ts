import { PluginIdentifierInterface } from './pluginIdentifier.interface';
import * as faker from 'faker';
import * as Factory from 'factory.ts';

export function pluginIdentifierInterfaceFactory(): Factory.Factory<PluginIdentifierInterface> {
    return Factory.Sync.makeFactory<PluginIdentifierInterface>({
        pluginSetId: faker.random.number(1, 500),
        pluginName: faker.internet.domainWord()
    });
}
