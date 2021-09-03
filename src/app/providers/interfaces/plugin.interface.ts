export interface PluginInterface {
    activeProductive: boolean;
    id: number;
    installed: boolean;
    isClosedSource: boolean;
    isConnectedWithGit: boolean;
    name: string;
    source: string;
    version: string;
}
