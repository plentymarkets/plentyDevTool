import * as path from 'path';
import { PluginIdentifierInterface } from '../app/providers/interfaces/pluginIdentifier.interface';

export class PathHelper {
    private readonly syncPath: string;

    constructor(syncPath: string) {
        this.syncPath = syncPath;
    }

    // noinspection JSMethodCanBeStatic
    public pluginIdentifierFromS3Key(key: string): PluginIdentifierInterface {
        if (key === null) {
            return null;
        }
        if (key.startsWith('/')) {
            key = key.substring(1);
        }
        const keyParts = key.split('/');

        return {
            pluginSetId: String(keyParts[0]),
            pluginName: String(keyParts[1])
        };
    }

    public localPathFromS3Key(s3Key: string, directoryOnly = false) {
        if (directoryOnly) {
            s3Key = s3Key.substring(0, s3Key.lastIndexOf(path.sep) + 1);
        }
        return path.join(this.syncPath, s3Key);
    }

    public s3KeyFromLocalPath(localPath: string) {
        if (!localPath.startsWith(this.syncPath)) {
            return null;
        }
        localPath = localPath.substring(this.syncPath.length + 1);
        return process.platform === 'win32' ? localPath.replace(new RegExp(/\\/, 'g'), '/') : localPath;
    }

    public pluginDirectoryFromS3Key(s3Key: string) {
        const pluginIdentifier = this.pluginIdentifierFromS3Key(s3Key);
        return path.join(
            this.syncPath,
            pluginIdentifier.pluginSetId,
            pluginIdentifier.pluginName
        );
    }
}
