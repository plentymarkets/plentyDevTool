import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { EVENTS } from '../../constants';
import { StorageService } from './storage.service';
import { SyncerOptionsInterface } from './interfaces/synceroptions.interface';
import { SyncSelectionService } from './sync-selection.service';
import { BehaviorSubject } from 'rxjs';
import { LocalChangeInterface } from './interfaces/localChange.interface';
import { BusyTypeEnum } from './enums/busyType.enum';
import { PluginIdentifierInterface } from './interfaces/pluginIdentifier.interface';
import { PluginService } from './plugin.service';
import { PluginSetInterface } from './interfaces/pluginset.interface';
import { PluginInterface } from './interfaces/plugin.interface';
import { PartialBuildResultInterface } from './interfaces/partialBuildResult.interface';
import { first } from 'rxjs/operators';
import { ProgressInterface } from './interfaces/progress.interface';
import { LoginDataInterface } from './interfaces/loginData.interface';

@Injectable({
    providedIn: 'root',
})
export class SyncService {
    public changes: BehaviorSubject<Array<LocalChangeInterface>>;
    public busy: BehaviorSubject<BusyTypeEnum>;
    public progress: BehaviorSubject<ProgressInterface>;
    public newPlugins: BehaviorSubject<Array<PluginIdentifierInterface>>;
    public buildErrors: BehaviorSubject<PartialBuildResultInterface>;
    public syncWorking: BehaviorSubject<boolean>;
    public loadingPlugins: BehaviorSubject<string>;
    private totalQueueSize: number;

    constructor(
        private electronService: ElectronService,
        private syncSelectionService: SyncSelectionService,
        private pluginService: PluginService
    ) {
        this.changes = new BehaviorSubject<Array<LocalChangeInterface>>([]);
        this.busy = new BehaviorSubject<BusyTypeEnum>(null);
        this.progress = new BehaviorSubject<ProgressInterface>({
            percentage: 0,
        });
        this.newPlugins = new BehaviorSubject<Array<PluginIdentifierInterface>>(
            []
        );
        this.buildErrors = new BehaviorSubject<PartialBuildResultInterface>(
            null
        );
        this.syncWorking = new BehaviorSubject<boolean>(false);
        this.loadingPlugins = new BehaviorSubject<string>(null);
        this.initEvents();
    }

    public init(detectNewPlugins: boolean = false) {
        const loginId: string = StorageService.getCurrentLoggedIn();
        const userData: LoginDataInterface = StorageService.getUserData(
            loginId
        );
        if (userData.syncPath) {
            this.busy.next(BusyTypeEnum.PROCESS_LOADING);
            const timestamp: number = this.syncSelectionService.syncSelection.length > 0 ? new Date().getTime() : null;
            const options: SyncerOptionsInterface = {
                accessToken: userData.accessToken,
                syncPath: this.electronService.path.join(
                    userData.syncPath,
                    userData.id
                ),
                syncSelection: this.syncSelectionService.syncSelection,
                systemURL: userData.domain,
                detectNewPlugins,
                timestamp
            };

            this.electronService.sendToSyncWorker(EVENTS.syncer.init, options);
        }
    }

    public resetSubjects() {
        this.loadingPlugins.next(null);
        this.changes.next([]);
        this.buildErrors.next(null);
        this.busy.next(null);
    }

    public resetAfterSwitch(): void {
        this.changes.next([]);
        this.busy.next(null);
        this.progress.next({ percentage: 0 });
        this.newPlugins.next([]);
        this.buildErrors.next(null);
        this.syncWorking.next(false);
    }

    public installPlugin(
        plugin: PluginIdentifierInterface,
        onFinished: () => void
    ) {
        this.busy.next(BusyTypeEnum.PUSH);
        this.electronService.ipcRenderer.once(EVENTS.queue.finished, () => {
            this.pluginService
                .getPluginSetsWithPlugins()
                .pipe(first())
                .subscribe(onFinished);
            this.pluginService.loadPluginSetsWithPlugins();
        });
        plugin.timestamp = this.syncSelectionService.syncSelection.length > 0 ? new Date().getTime() : null;
        this.electronService.sendToSyncWorker(
            EVENTS.syncer.installPlugin,
            plugin
        );
    }

    public detectNewPlugins() {
        this.busy.next(BusyTypeEnum.PROCESS_LOADING);
        this.init(true);
    }

    public pull() {
        this.busy.next(BusyTypeEnum.PULL);
        const timestamp: number = this.syncSelectionService.syncSelection.length > 0 ? new Date().getTime() : null;
        this.electronService.sendToSyncWorker(EVENTS.syncer.pull, {timestamp});
    }

    public push() {
        this.busy.next(BusyTypeEnum.PUSH);
        const changes = this.changes.getValue();
        this.pluginService
            .getPluginBuildOverview()
            .subscribe((buildOverview: any) => {
                const buildAlreadyRunningForCurrentChanges = Object.keys(
                    buildOverview
                ).some((setId: string) => {
                    return (
                        buildOverview[setId].in_progress &&
                        changes.some((change: LocalChangeInterface) =>
                            change.path.startsWith(
                                setId + this.electronService.path.sep
                            )
                        )
                    );
                });
                if (buildAlreadyRunningForCurrentChanges) {
                    this.busy.next(null);
                    this.buildErrors.next({
                        buildErrors: null,
                        buildExecuted: null,
                        changesPushed: false,
                    });
                } else {
                    this.buildErrors.next(null);
                    const timestamp: number = this.syncSelectionService.syncSelection.length > 0 ? new Date().getTime() : null;
                    this.electronService.sendToSyncWorker(EVENTS.syncer.push, {timestamp});
                }
            });
    }

    public stop() {
        this.electronService.sendToSyncWorker(EVENTS.syncer.stop);
    }

    private initEvents() {
        this.electronService.ipcRenderer.on(EVENTS.watcher.loadingPlugins, (event, changes) => {
            this.loadingPlugins.next(changes);
            this.busy.next(BusyTypeEnum.PROCESS_LOADING);
            this.syncWorking.next(false);
        });
        this.electronService.ipcRenderer.on(
            EVENTS.watcher.publishChanges,
            (event, changes) => {
                this.changes.next(changes);
                this.busy.next(null);
                this.syncWorking.next(false);
            }
        );
        this.electronService.ipcRenderer.on(
            EVENTS.queue.start,
            (event, totalQueueSize) => (this.totalQueueSize = totalQueueSize)
        );
        this.electronService.ipcRenderer.on(
            EVENTS.queue.progress,
            (event, progress, currentJob) => {
                if (this.totalQueueSize && +this.totalQueueSize > 0) {
                    this.progress.next({
                        percentage: Math.floor(
                            ((this.totalQueueSize - progress) /
                                this.totalQueueSize) *
                                100
                        ),
                        currentJob,
                    });
                }
            }
        );
        this.electronService.ipcRenderer.on(EVENTS.queue.finished, () =>
            this.busy.next(BusyTypeEnum.PROCESS_LOADING)
        );
        this.electronService.ipcRenderer.on(
            EVENTS.syncer.buildErrors,
            (event, buildExecuted: boolean, buildErrors: Array<string>) => {
                this.buildErrors.next({
                    buildExecuted,
                    buildErrors,
                    changesPushed: true,
                });
            }
        );
        this.electronService.ipcRenderer.on(
            EVENTS.watcher.notSyncedPlugins,
            (event, notSyncedPlugins) => {
                const newPlugins: Array<PluginIdentifierInterface> = [];
                this.pluginService
                    .getPluginSetsWithPlugins()
                    .pipe(first())
                    .subscribe((pluginSets: Array<PluginSetInterface>) => {
                        notSyncedPlugins.forEach(
                            (notSyncedPlugin: PluginIdentifierInterface) => {
                                if (
                                    this.pluginSetsContainId(
                                        pluginSets,
                                        notSyncedPlugin.pluginSetId
                                    ) &&
                                    !this.pluginSetContainsPlugin(
                                        pluginSets,
                                        notSyncedPlugin
                                    )
                                ) {
                                    newPlugins.push(notSyncedPlugin);
                                }
                            }
                        );
                    });
                this.newPlugins.next(newPlugins);
            }
        );
        this.electronService.ipcRenderer.on(EVENTS.watcher.working, () =>
            this.syncWorking.next(true)
        );

        this.electronService.ipcRenderer.on(EVENTS.menu.pull, () =>
            this.pull()
        );
        this.electronService.ipcRenderer.on(EVENTS.menu.push, () =>
            this.push()
        );
        this.electronService.ipcRenderer.on(EVENTS.menu.detect, () =>
            this.detectNewPlugins()
        );
    }

    private pluginSetContainsPlugin(
        pluginSets: Array<PluginSetInterface>,
        notSyncedPlugin: PluginIdentifierInterface
    ) {
        return pluginSets.some((pluginSet: PluginSetInterface) => {
            return (
                String(pluginSet.id) === String(notSyncedPlugin.pluginSetId) &&
                pluginSet.plugins.some((installedPlugin: PluginInterface) => {
                    return installedPlugin.name === notSyncedPlugin.pluginName;
                })
            );
        });
    }

    private pluginSetsContainId(
        pluginSets: Array<PluginSetInterface>,
        pluginSetId: string
    ) {
        return pluginSets.some((pluginSet: PluginSetInterface) => {
            return String(pluginSet.id) === String(pluginSetId);
        });
    }
}
