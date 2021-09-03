import { SyncJobEntryInterface } from './syncJob.interface';

export interface ProgressInterface {
    percentage: number;
    currentJob?: SyncJobEntryInterface;
}
