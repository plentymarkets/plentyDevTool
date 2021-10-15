import * as cs from 'checksum';
import * as fs from 'fs';
import * as path from 'path';
import { Database } from './database';

export class ContentChecker {
    constructor(private database: Database, private syncPath: string) {
    }

    public isContentChanged(filePath: string, checksum: string = null) {
        if (process.platform !== 'darwin') {
            // on windows & linux we can rely on the timestamps.
            return true;
        }

        if (!filePath.startsWith(this.syncPath)) {
            filePath = path.join(this.syncPath, filePath);
        }

        if (!checksum) {
            const entry = this.database.getEntry(filePath);
            if (!entry) {
                return true;
            }
            const storedChecksum = entry.checksum;
            if (!storedChecksum) {
                this.database.addFile(filePath);
                return true;
            }
            checksum = storedChecksum;
        }

        return cs(fs.readFileSync(filePath)) !== checksum;
    }
}
