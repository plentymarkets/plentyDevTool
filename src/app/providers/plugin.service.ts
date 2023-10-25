import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { PluginSetInterface } from './interfaces/pluginset.interface';
import { ROUTES } from '../../constants';
import { StorageService } from './storage.service';
import { AlertService } from './alert.service';
import { AlertTypeEnum } from './enums/alert-type.enum';

@Injectable({
    providedIn: 'root'
    })
export class PluginService {
    private readonly pluginSets: BehaviorSubject<Array<PluginSetInterface>>;
    private loginId: string;

    constructor(private _httpClient: HttpClient, private _alertService: AlertService) {
        this.pluginSets = new BehaviorSubject<Array<PluginSetInterface>>([]);
    }

    public getPluginSetsWithPlugins() {
        return this.pluginSets;
    }

    public loadPluginSetsWithPlugins() {
        this.resetList();
        this.loginId = StorageService.getCurrentLoggedIn();
        this._httpClient.get(StorageService.getUserData(this.loginId).domain + ROUTES.getOpensourcePlugins)
            .subscribe((pluginSets: Array<PluginSetInterface>) => {
                pluginSets.forEach((pluginSet: PluginSetInterface) => {
                    const plugins = [];
                    if (pluginSet.pluginSetEntriesWithTrashed) {
                        Object.values(pluginSet.pluginSetEntriesWithTrashed).forEach((pluginSetEntry: any) => {
                            if (pluginSetEntry.hasOwnProperty('plugin')) {
                                plugins.push(pluginSetEntry.plugin);
                            }
                        });
                    }
                    pluginSet.plugins = plugins;
                });
                this.pluginSets.next(pluginSets);
            },
            (error: HttpErrorResponse) => {
                this._alertService.addAlert(AlertTypeEnum.danger, error);
            });
    }

    public resetList() {
        this.pluginSets.next([]);
    }

    public getPluginBuildOverview() {
        this.loginId = StorageService.getCurrentLoggedIn();
        return this._httpClient.get(StorageService.getUserData(this.loginId).domain + ROUTES.getPluginBuildOverview);
    }
}
