import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { PluginSetInterface } from './interfaces/pluginset.interface';
import { ROUTES } from '../../constants';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class PluginService {
    private readonly pluginSets: BehaviorSubject<Array<PluginSetInterface>>;
    private loginId: string;

    constructor(private httpClient: HttpClient) {
        this.pluginSets = new BehaviorSubject<Array<PluginSetInterface>>([]);
    }

    public getPluginSetsWithPlugins() {
        return this.pluginSets;
    }

    public loadPluginSetsWithPlugins() {
        this.resetList();
        this.loginId = StorageService.getCurrentLoggedIn();
        this.httpClient.get(StorageService.getUserData(this.loginId).domain + ROUTES.getOpensourcePlugins)
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
            });
    }

    public resetList() {
        this.pluginSets.next([]);
    }

    public getPluginBuildOverview() {
        this.loginId = StorageService.getCurrentLoggedIn();
        return this.httpClient.get(StorageService.getUserData(this.loginId).domain + ROUTES.getPluginBuildOverview);
    }
}
