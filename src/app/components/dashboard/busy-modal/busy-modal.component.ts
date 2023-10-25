import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../../../providers/sync.service';
import { Subscription } from 'rxjs';
import { BusyTypeEnum } from '../../../providers/enums/busyType.enum';
import { ProgressInterface } from '../../../providers/interfaces/progress.interface';
import { ElectronService } from '../../../providers/electron.service';
import { SyncType } from '../../../providers/enums/syncType.enum';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-busy-modal',
    templateUrl: './busy-modal.component.html',
    styleUrls: ['./busy-modal.component.scss']
    })
export class BusyModalComponent implements OnInit, OnDestroy {
    public currentAction = '';
    public value = 0;
    public showValue = false;
    public currentJobFilename = '';
    public currentJobAction = '';
    private subscriptions = [];

    constructor(
        private syncService: SyncService,
        private changeDetectorRef: ChangeDetectorRef,
        private electronService: ElectronService,
        private translateService: TranslateService
    ) {
    }

    public ngOnInit() {
        this.subscriptions.push(
            this.syncService.progress.subscribe((progress: ProgressInterface) => {
                this.value = progress ? progress.percentage : 0;
                if (progress.currentJob) {
                    this.currentJobFilename = progress.currentJob.s3Key.replace(/\//g, '<wbr />/');
                    switch (progress.currentJob.syncType) {
                        case SyncType.DOWNLOAD_SINGLE_FILE: {
                            this.currentJobAction = this.translateService.instant('action.download_file');
                            break;
                        }
                        case SyncType.DOWNLOAD_PLUGIN_ZIP: {
                            this.currentJobAction = this.translateService.instant('action.download_zip');
                            break;
                        }
                        case SyncType.UPLOAD: {
                            this.currentJobAction = this.translateService.instant('action.upload_file');
                            break;
                        }
                        case SyncType.DELETE_LOCAL: {
                            this.currentJobAction = this.translateService.instant('action.delete_local_file');
                            break;
                        }
                        default: {
                            throw new Error('Unknown job');
                        }
                    }
                } else {
                    this.currentJobAction = '';
                    this.currentJobFilename = '';
                }
                this.changeDetectorRef.detectChanges();
            }),
            this.syncService.busy.subscribe((currentAction: BusyTypeEnum) => {
                this.currentAction = currentAction;
                const actionEmitsProgress = currentAction === BusyTypeEnum.PUSH || currentAction === BusyTypeEnum.PULL;
                this.value = actionEmitsProgress ? 0 : 100;
                this.showValue = actionEmitsProgress;
                this.changeDetectorRef.detectChanges();
            })
        );
    }

    public ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    }
}
