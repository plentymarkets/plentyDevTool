import { PluginIdentifierInterface } from './pluginIdentifier.interface';

export interface SyncerOptionsInterface {
    systemURL: string;
    accessToken: string;
    syncSelection: Array<PluginIdentifierInterface>;
    syncPath: string;
    detectNewPlugins: boolean;
    timestamp?: number;
}
