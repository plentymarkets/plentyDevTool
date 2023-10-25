import { Component, Input, OnChanges } from '@angular/core';
import { StorageService } from '../../../providers/storage.service';
import { SyncService } from '../../../providers/sync.service';
import { ElectronService } from '../../../providers/electron.service';

@Component({
    selector: 'app-path-config',
    templateUrl: './path-config.component.html',
    styleUrls: ['./path-config.component.scss'],
})
export class PathConfigComponent implements OnChanges {
    @Input() public loginId: string;
    public savedPath = false;
    public selectedPath = '';

    constructor(
        private syncService: SyncService,
        private electronService: ElectronService
    ) {}

    public ngOnChanges(): void {
        if (
            StorageService.getUserData(this.loginId) &&
            StorageService.getUserData(this.loginId).syncPath
        ) {
            this.selectedPath = StorageService.getUserData(
                this.loginId
            ).syncPath;
        }
    }

    public getPath() {
        this.electronService.remote.dialog
            .showOpenDialog(null, {
                properties: ['openDirectory'],
            })
            .then((path) => {
                if (this.checkSelectedPath(path)) {
                    this.selectedPath = path.filePaths[0];
                    StorageService.addSyncPath(
                        StorageService.getCurrentLoggedIn(),
                        this.selectedPath
                    );
                    StorageService.setSyncAttributes(
                        StorageService.getCurrentLoggedIn(),
                        this.selectedPath,
                        null
                    );
                    this.syncService.init();
                    this.savedPath = true;
                }
            });
    }

    private checkSelectedPath(path: any): boolean {
        return (
            path.canceled === false &&
            Array.isArray(path.filePaths) &&
            path.filePaths.length > 0
        );
    }

    public deleteSelection() {
        this.selectedPath = '';
        this.savedPath = false;
        StorageService.addSyncPath(StorageService.getCurrentLoggedIn(), null);
        this.syncService.init();
    }
}
