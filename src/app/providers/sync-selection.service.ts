import { Injectable } from '@angular/core';
import { PluginIdentifierInterface } from './interfaces/pluginIdentifier.interface';
import { StorageService } from './storage.service';
import { PluginSetInterface } from './interfaces/pluginset.interface';
import { PluginInterface } from './interfaces/plugin.interface';

@Injectable({
    providedIn: 'root',
    })
export class SyncSelectionService {
    public isSelectionLoaded = false;
    public syncSelection: Array<PluginIdentifierInterface>;
    private loginId: string;

    constructor() {
        this.loadSyncSelection();
    }

    public loadSyncSelection() {
        this.loginId = StorageService.getCurrentLoggedIn();
        if (
            StorageService.getUserData(this.loginId) &&
            StorageService.getUserData(this.loginId).syncSelection
        ) {
            this.syncSelection = JSON.parse(
                StorageService.getUserData(this.loginId).syncSelection
            );
        } else {
            this.syncSelection = [];
        }
    }

    public toggle(pluginKey: PluginIdentifierInterface) {
        const entry = this.findEntry(pluginKey);
        if (entry) {
            this.syncSelection = this.syncSelection.filter(
                (key: PluginIdentifierInterface) => {
                    return entry !== key;
                }
            );
        } else {
            this.syncSelection.push(pluginKey);
        }
        StorageService.addSyncSelection(
            StorageService.getCurrentLoggedIn(),
            JSON.stringify(this.syncSelection)
        );
        StorageService.setSyncAttributes(
            StorageService.getCurrentLoggedIn(),
            null,
            JSON.stringify(this.syncSelection)
        );
    }

    public findEntry(pluginKey: PluginIdentifierInterface) {
        return this.syncSelection.find((key: PluginIdentifierInterface) => {
            return (
                String(key.pluginName) === String(pluginKey.pluginName) &&
                String(key.pluginSetId) === String(pluginKey.pluginSetId)
            );
        });
    }

    public removeNotAvailablePlugins(pluginSets: Array<PluginSetInterface>) {
        this.syncSelection = this.syncSelection.filter(
            (pluginIdentifier: PluginIdentifierInterface) => {
                return pluginSets.some((pluginSet: PluginSetInterface) => {
                    return (
                        pluginSet.id === pluginIdentifier.pluginSetId &&
                        pluginSet.plugins.some((plugin: PluginInterface) => {
                            return plugin.name === pluginIdentifier.pluginName;
                        })
                    );
                });
            }
        );
        StorageService.addSyncSelection(
            StorageService.getCurrentLoggedIn(),
            JSON.stringify(this.syncSelection)
        );
        StorageService.setSyncAttributes(
            StorageService.getCurrentLoggedIn(),
            null,
            JSON.stringify(this.syncSelection)
        );
    }
}
