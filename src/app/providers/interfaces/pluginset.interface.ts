import { PluginInterface } from './plugin.interface';
import { WebstoreInterface } from './webstore.interface';

export interface PluginSetInterface {
    id: string;
    name: string;
    plugins: Array<PluginInterface>;
    webstores: Array<WebstoreInterface>;
    pluginSetEntriesWithTrashed?: { [key: string]: PluginInterface };
}
