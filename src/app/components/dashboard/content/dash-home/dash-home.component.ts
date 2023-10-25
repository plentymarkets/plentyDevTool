import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnChanges,
    Input,
} from '@angular/core';
import { SyncService } from '../../../../providers/sync.service';
import { LocalChangeInterface } from '../../../../providers/interfaces/localChange.interface';
import { Subject, Subscription } from 'rxjs';
import { PluginService } from '../../../../providers/plugin.service';
import { PluginSetInterface } from '../../../../providers/interfaces/pluginset.interface';
import { KeyValue } from '@angular/common';
import { StorageService } from '../../../../providers/storage.service';
import { PluginIdentifierInterface } from '../../../../providers/interfaces/pluginIdentifier.interface';
import { PartialBuildResultInterface } from '../../../../providers/interfaces/partialBuildResult.interface';
import { TranslateService } from '@ngx-translate/core';
import {
    EVENTS,
    FORBIDDEN_CHARACTERS,
    MENU_ITEMS,
} from '../../../../../constants';
import { ElectronService } from '../../../../providers/electron.service';
import { BusyTypeEnum } from '../../../../providers/enums/busyType.enum';
import { AlertService } from '../../../../providers/alert.service';

@Component({
    selector: 'app-dash-home',
    templateUrl: './dash-home.component.html',
    styleUrls: ['./dash-home.component.scss'],
})
export class DashHomeComponent implements OnDestroy, OnChanges {
    public loadingPlugins: string;
    public isLoading = false;
    public changes: Array<LocalChangeInterface>;
    public selectedPath = '';
    public pluginSets: Array<PluginSetInterface>;
    public newPlugins: Array<PluginIdentifierInterface> = [];
    public buildResult: PartialBuildResultInterface;
    public successMessage = '';
    public changesWithForbiddenCharacters: Array<LocalChangeInterface>;
    public changesRequireFullBuild: Array<LocalChangeInterface>;
    public isSyncWorking = false;
    private subscriptions = [];
    private buildSuccess: boolean;
    private success = new Subject<string>();
    private forbiddenCharactersParams: {
        signs: string;
        asciiStart: number;
        asciiStop: number;
    };
    @Input() public loginId: string;

    constructor(
        public syncService: SyncService,
        private changeDetectorRef: ChangeDetectorRef,
        private pluginService: PluginService,
        private translateService: TranslateService,
        private electronService: ElectronService,
        private alertService: AlertService
    ) {
        this.forbiddenCharactersParams = {
            signs: FORBIDDEN_CHARACTERS.signs.join(', '),
            asciiStart: FORBIDDEN_CHARACTERS.asciiCodes.start,
            asciiStop: FORBIDDEN_CHARACTERS.asciiCodes.end,
        };
    }

    public ngOnChanges(): void {
        this.changes = [];
        this.selectedPath = '';
        this.pluginSets = [];
        this.newPlugins = [];
        this.changesWithForbiddenCharacters = [];
        if (
            StorageService.getUserData(this.loginId) &&
            StorageService.getUserData(this.loginId).syncPath !== null &&
            StorageService.getUserData(this.loginId).syncPath !== undefined
        ) {
            this.selectedPath = StorageService.getUserData(
                this.loginId
            ).syncPath;
        }
        this.alertService.resetAlerts();
        this.initSubscriptions();
    }

    public ngOnDestroy(): void {
        this.subscriptions.forEach((subscription: Subscription) =>
            subscription.unsubscribe()
        );
    }

    public setPushMenuItemState(state: boolean) {
        this.electronService.sendToMain(
            state ? EVENTS.menu.enable : EVENTS.menu.disable,
            MENU_ITEMS.actions.push
        );
    }

    public getPluginSetNameFromKeyValue(
        set: KeyValue<number, LocalChangeInterface>
    ) {
        return this.getPluginSetName(String(set.key));
    }

    public getPluginSetName(pluginSetId: string) {
        const foundPluginSet = this.pluginSets.find(
            (pluginSet: PluginSetInterface) => +pluginSetId === +pluginSet.id
        );
        return foundPluginSet
            ? foundPluginSet.name
            : 'Plugin set ' + pluginSetId;
    }

    public installPlugin(newPlugin: PluginIdentifierInterface) {
        this.syncService.installPlugin(newPlugin, () => {
            this.removeNewPluginFromList(newPlugin);
            this.success.next(
                this.translateService.instant('sync.installSuccess', {
                    pluginName: newPlugin.pluginName,
                    pluginSetName: this.getPluginSetName(newPlugin.pluginSetId),
                })
            );
        });
    }

    public removeNewPluginFromList(plugin: PluginIdentifierInterface) {
        const indexToRemove = this.newPlugins.findIndex(
            (findPlugin: PluginIdentifierInterface) => {
                return (
                    String(plugin.pluginSetId) ===
                        String(findPlugin.pluginSetId) &&
                    plugin.pluginName === findPlugin.pluginName
                );
            }
        );
        this.newPlugins.splice(indexToRemove, 1);
        this.changeDetectorRef.detectChanges();
    }

    public closeMessage() {
        this.successMessage = '';
        this.changeDetectorRef.detectChanges();
    }

    // noinspection JSMethodCanBeStatic
    private prepareDataChanges(changes: Array<any>): Array<any> {
        const preparedDataChanges: Array<any> = [];
        for (const change of changes) {
            const trimData =
                change.path.indexOf('/') > -1
                    ? change.path.split('/')
                    : change.path.split('\\');
            if (
                trimData instanceof Array &&
                trimData.length > 2 &&
                !trimData[2].startsWith('.')
            ) {
                if (
                    !preparedDataChanges.hasOwnProperty(trimData[0].toString())
                ) {
                    preparedDataChanges[trimData[0].toString()] = [];
                }
                if (
                    !preparedDataChanges[trimData[0].toString()].hasOwnProperty(
                        trimData.slice(0, 2).join('/')
                    )
                ) {
                    preparedDataChanges[trimData[0].toString()][
                        trimData.slice(0, 2).join('/')
                    ] = [];
                }
                const path = trimData.slice(2, trimData.length).join('/');
                const typePath = JSON.parse(
                    '{"' + change.changeType.toString() + '":"' + path + '"}'
                );
                preparedDataChanges[trimData[0].toString()][
                    trimData.slice(0, 2).join('/')
                ].push(typePath);
            }
        }
        return preparedDataChanges;
    }

    private initSubscriptions(): void {
        this.subscriptions.push(
            this.syncService.loadingPlugins.subscribe((loadingPlugins: string) => {
                this.loadingPlugins = loadingPlugins;
                this.changeDetectorRef.detectChanges();
            }),
            this.syncService.changes.subscribe(
                (changes: Array<LocalChangeInterface>) => {
                    const allowedChanges = [];
                    if (changes.length > 0) {
                        this.changesRequireFullBuild = [];
                        this.buildResult = null;
                    }
                    this.changesWithForbiddenCharacters = [];
                    changes.forEach((change: LocalChangeInterface) => {
                        if (change.containsForbiddenCharacters) {
                            this.changesWithForbiddenCharacters.push(change);
                        } else {
                            allowedChanges.push(change);
                        }
                        if (this.isFullBuildRequired(change)) {
                            this.changesRequireFullBuild.push(change);
                        }
                    });
                    this.changes = this.prepareDataChanges(allowedChanges);
                    this.setPushMenuItemState(!!this.changes.length);
                    this.changeDetectorRef.detectChanges();
                    this.isLoading = false;
                }
            ),
            this.pluginService
                .getPluginSetsWithPlugins()
                .subscribe((pluginSets: Array<PluginSetInterface>) => {
                    this.pluginSets = pluginSets;
                    this.changeDetectorRef.detectChanges();
                }),
            this.syncService.buildErrors.subscribe(
                (buildResult: PartialBuildResultInterface) => {
                    this.buildResult = buildResult;
                    if (
                        buildResult &&
                        Array.isArray(this.buildResult.buildErrors)
                    ) {
                        this.buildSuccess =
                            this.buildResult.buildErrors.length <= 0;
                    }
                    this.changeDetectorRef.detectChanges();
                }
            ),
            this.syncService.newPlugins.subscribe(
                (newPlugins: Array<PluginIdentifierInterface>) => {
                    this.newPlugins = newPlugins;
                    this.changeDetectorRef.detectChanges();
                }
            ),
            this.success.subscribe((message: string) => {
                this.successMessage = message;
                this.changeDetectorRef.detectChanges();
            }),
            this.syncService.syncWorking.subscribe((isSyncWorking: boolean) => {
                this.isSyncWorking = isSyncWorking;
                this.changeDetectorRef.detectChanges();
            }),
            this.syncService.busy.subscribe((busy: BusyTypeEnum) => {
                this.isLoading = busy === BusyTypeEnum.PROCESS_LOADING;
                this.changeDetectorRef.detectChanges();
            })
        );
    }

    private isFullBuildRequired(change: LocalChangeInterface): boolean {
        const existingFile: LocalChangeInterface = this.changesRequireFullBuild.find(
            (element: LocalChangeInterface) => {
                return element.path === change.path;
            }
        );
        if (existingFile !== undefined) {
            return false;
        }

        return change.path.includes('plugin.json');
    }
}
