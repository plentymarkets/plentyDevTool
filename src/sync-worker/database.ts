import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as path from 'path';
import * as log from 'electron-log';
import * as cs from 'checksum';
import * as fs from 'fs';
import * as remote from '@electron/remote';

const DOT_REPLACEMENT = '___DOT___';
const TIMESTAMP_DELAY_SECONDS = 2;

export class Database {

    // TODO try FileAsync db adapter

    private db: lowdb.LowdbSync<any>;

    constructor() {
        this.initDatabase();
    }

    private static replaceDots(original: string) {
        return original.replace(/\./g, DOT_REPLACEMENT);
    }

    private static revertReplaceDots(original: string) {
        return original.replace(new RegExp(DOT_REPLACEMENT, 'g'), '.');
    }

    public getEntry(filePath: string) {
        let value = this.db.get('files.' + Database.replaceDots(filePath)).value();
        if (typeof value === 'number') {
            value = {
                timestamp: value,
                checksum: null,
                filepath: filePath
            };
        }
        return value;
    }

    public addFile(filePath: string, withDelay = false) {
        return this.db.set(
            'files.' + Database.replaceDots(filePath),
            {
                checksum: process.platform === 'darwin' ? cs(fs.readFileSync(filePath)) : null,
                timestamp: +new Date() + (withDelay ? (TIMESTAMP_DELAY_SECONDS * 1000) : 0)
            }
        ).write();
    }

    public removeFile(key: string) {
        return this.db.unset('files.' + Database.replaceDots(key)).write();
    }

    public all(syncPath: string) {
        const files = this.db.get('files').value();

        if (!files) {
            return [];
        }

        return Object.entries(files)
            .map(entry => {
                if (!Array.isArray(entry) || !(entry.length >= 2)) {
                    return null;
                }

                let value: any = entry[1];
                if (typeof value === 'number') {
                    value = {
                        timestamp: value,
                        checksum: null
                    };
                }

                return Array.isArray(entry) && entry.length >= 2
                    ? {filePath: Database.revertReplaceDots(entry[0]), timestamp: value.timestamp, checksum: value.checksum}
                    : null;
            })
            .filter(entry => entry && entry.filePath.startsWith(syncPath));
    }

    public flush() {
        this.db.set('files', []).write();
        log.debug('Database flushed');
    }

    private initDatabase() {
        const filePath = path.join(remote.app.getPath('userData'), 'file_database.json');
        this.db = lowdb(new FileSync(filePath));
        log.info('Use database', filePath);
    }
}
