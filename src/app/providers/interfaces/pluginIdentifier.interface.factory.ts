import { PluginIdentifierInterface } from './pluginIdentifier.interface';
import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';

export function pluginIdentifierInterfaceFactory(): Factory.Factory<PluginIdentifierInterface> {
    return Factory.Sync.makeFactory<PluginIdentifierInterface>({
        pluginSetId: faker.datatype.number({min: 1, max: 500}).toString(),
        pluginName: faker.internet.domainWord()
    });
}
