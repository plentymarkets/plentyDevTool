import { SyncType } from '../enums/syncType.enum';

export interface SyncJobEntryInterface {
    s3Key: string;
    syncType: SyncType;
}
