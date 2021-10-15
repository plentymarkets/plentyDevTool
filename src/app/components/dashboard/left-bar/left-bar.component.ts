import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    ApplicationRef,
    OnDestroy,
    ChangeDetectorRef,
} from '@angular/core';
import { PluginSetInterface } from '../../../providers/interfaces/pluginset.interface';
import { SyncSelectionService } from '../../../providers/sync-selection.service';
import { PluginIdentifierInterface } from '../../../providers/interfaces/pluginIdentifier.interface';
import { WebstoreInterface } from '../../../providers/interfaces/webstore.interface';
import { SyncService } from '../../../providers/sync.service';
import { BusyTypeEnum } from '../../../providers/enums/busyType.enum';
import { BusyModalComponent } from '../busy-modal/busy-modal.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PluginService } from '../../../providers/plugin.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationModalComponent } from '../notification-modal/notification-modal.component';

@Component({
    selector: 'app-left-bar',
    templateUrl: './left-bar.component.html',
    styleUrls: ['./left-bar.component.scss'],
})
export class LeftBarComponent implements OnChanges, OnDestroy {
    @Input() public loginId: string;
    @Output() public refreshButtonClicked = new EventEmitter();
    public pluginSets: Array<PluginSetInterface>;
    protected isExpanded = [];

    private modal: NgbModalRef;
    private subscriptions: Array<Subscription> = [];

    constructor(
        public pluginService: PluginService,
        private syncSelectionService: SyncSelectionService,
        private syncService: SyncService,
        private modalService: NgbModal,
        private applicationRef: ApplicationRef,
        private changeDetectorRef: ChangeDetectorRef
    ) {}

    public ngOnChanges(): void {
        this.syncSelectionService.isSelectionLoaded = false;
        this.syncService.busy.subscribe((currentAction: BusyTypeEnum) => {
            /*
             * This promise is just a workaround. It prevents BusyModalComponent being added dynamically,
             * before angular change detection has finished it's first loop.
             */
            Promise.resolve().then(() => {
                if (currentAction && currentAction !== BusyTypeEnum.PROCESS_LOADING && !this.modal) {
                    this.modal = this.modalService.open(BusyModalComponent, {
                        backdrop: 'static',
                        windowClass: 'show',
                        backdropClass: 'transparent',
                        centered: true,
                        keyboard: false,
                    });
                    this.applicationRef.tick();
                } else if ((!currentAction || currentAction === BusyTypeEnum.PROCESS_LOADING) && this.modal) {
                    this.modal.close();
                    this.modal = null;
                }
            });
        });
        this.syncSelectionService.loadSyncSelection();
        this.pluginService.resetList();
        const pluginSubscription: Subscription = this.pluginService
            .getPluginSetsWithPlugins()
            .subscribe((pluginSets: Array<PluginSetInterface>) => {
                this.pluginSets = pluginSets;
                if (this.pluginSets && this.pluginSets.length > 0) {
                    this.syncSelectionService.removeNotAvailablePlugins(
                        pluginSets
                    );
                    this.syncSelectionService.isSelectionLoaded = true;
                }
                this.changeDetectorRef.detectChanges();
            },
            (errorResponse: HttpErrorResponse) => {
                if (errorResponse.status === 401) {
                    const ref = this.modalService.open(NotificationModalComponent, {
                        backdrop: 'static',
                        centered: true,
                        windowClass: 'notification-modal',
                    });
                    ref.componentInstance.userId = this.loginId;
                }
            });
        this.subscriptions.push(pluginSubscription);
        this.pluginService.loadPluginSetsWithPlugins();
        this.syncService.init();
    }

    public ngOnDestroy(): void {
        this.subscriptions.forEach((subscription: Subscription) =>
            subscription.unsubscribe()
        );
    }

    /**
     * get webstore names
     * @param webStores
     */
    public getWebstoresNames(webStores: Array<WebstoreInterface>) {
        return webStores
            .map((webstore: WebstoreInterface) => webstore.name)
            .join(', ');
    }

    public toggle(plugin: PluginIdentifierInterface) {
        this.syncSelectionService.toggle(plugin);
        this.syncService.init();
    }

    public expand() {
        this.pluginSets.forEach((element) => {
            this.isExpanded[element.id] = true;
        });
    }

    public collapse() {
        this.pluginSets.forEach((element) => {
            this.isExpanded[element.id] = false;
        });
    }
}
