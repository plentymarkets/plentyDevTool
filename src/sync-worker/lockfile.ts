import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { LOCKFILE_NAME } from '../constants';
import { SyncJobEntryInterface } from '../app/providers/interfaces/syncJob.interface';

export class Lockfile {
    private readonly lockFilePath: string;

    constructor(syncPath: string) {
        this.lockFilePath = path.join(syncPath, LOCKFILE_NAME);
    }

    public read() {
        try {
            return JSON.parse(fs.readFileSync(this.lockFilePath).toString()) as SyncJobEntryInterface;
        } catch (e) {
            return null;
        }
    }

    public write(job: SyncJobEntryInterface) {
        fse.outputFileSync(this.lockFilePath, JSON.stringify(job));
    }

    public remove() {
        fse.removeSync(this.lockFilePath);
    }
}
