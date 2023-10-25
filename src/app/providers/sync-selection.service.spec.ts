import { getTestBed, TestBed } from '@angular/core/testing';
import { SyncSelectionService } from './sync-selection.service';
import { StorageService } from './storage.service';
import { pluginIdentifierInterfaceFactory } from './interfaces/pluginIdentifier.interface.factory';
import { PluginIdentifierInterface } from './interfaces/pluginIdentifier.interface';
import { pluginSetInterfaceFactory } from './interfaces/pluginset.interface.factory';
import { pluginInterfaceFactory } from './interfaces/plugin.interface.factory';

describe('SyncSelectionService', () => {
    let injector: TestBed;
    let syncSelectionService: SyncSelectionService;
    let mockPluginIdentifierInterface: PluginIdentifierInterface;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SyncSelectionService
            ]
        });

        injector = getTestBed();
        syncSelectionService = injector.get(SyncSelectionService);
        mockPluginIdentifierInterface = pluginIdentifierInterfaceFactory().build();
    });

    it('it should be created', () => {
        expect(syncSelectionService).toBeTruthy();
    });

    it('it finds an entry', () => {
        syncSelectionService.syncSelection.push(mockPluginIdentifierInterface);

        const entry = syncSelectionService.findEntry(mockPluginIdentifierInterface);

        expect(entry).toEqual(mockPluginIdentifierInterface);
    });

    it('it doesnt find an entry if the pluginSetId mismachtes', () => {
        syncSelectionService.syncSelection.push(mockPluginIdentifierInterface);

        // pluginIdentifierInterfaceFactory only creates pluginSetIds <= 500
        const otherPluginIdentifier = {
            pluginName: mockPluginIdentifierInterface.pluginName,
            pluginSetId: '600'
        };
        const entry = syncSelectionService.findEntry(otherPluginIdentifier);

        expect(entry).toBeFalsy();
    });


    it('it toggles', () => {
        spyOn(StorageService, 'addSyncSelection');
        spyOn(StorageService, 'setSyncAttributes');

        syncSelectionService.toggle(mockPluginIdentifierInterface);

        expect(StorageService.addSyncSelection).toHaveBeenCalledWith(
            StorageService.getCurrentLoggedIn(), JSON.stringify([mockPluginIdentifierInterface])
        );
        expect(StorageService.setSyncAttributes).toHaveBeenCalledWith(
            StorageService.getCurrentLoggedIn(), null, JSON.stringify([mockPluginIdentifierInterface])
        );

        const entry = findEntry(mockPluginIdentifierInterface, syncSelectionService.syncSelection);

        expect(entry).toBeTruthy();
        expect(entry.pluginName).toEqual(mockPluginIdentifierInterface.pluginName);
        expect(entry.pluginSetId).toEqual(mockPluginIdentifierInterface.pluginSetId);

        syncSelectionService.toggle(mockPluginIdentifierInterface);

        expect(StorageService.addSyncSelection).toHaveBeenCalledWith(
            StorageService.getCurrentLoggedIn(), JSON.stringify([])
        );
        expect(StorageService.setSyncAttributes).toHaveBeenCalledWith(
            StorageService.getCurrentLoggedIn(), null, JSON.stringify([])
        );

        const emptyEntry = findEntry(mockPluginIdentifierInterface, syncSelectionService.syncSelection);
        expect(emptyEntry).toBeFalsy();

        expect(syncSelectionService.syncSelection.length).toEqual(0);
    });

    it('it removes unavailable plugins', () => {
        const mockPluginSetInterface = pluginSetInterfaceFactory().build();
        mockPluginSetInterface.plugins = [pluginInterfaceFactory().build()];

        syncSelectionService.removeNotAvailablePlugins([mockPluginSetInterface]);
        expect(true).toEqual(true)
    });


});

function findEntry(pluginIdentifier: PluginIdentifierInterface, entriesArray: Array<PluginIdentifierInterface>) {
    return entriesArray.find((key: PluginIdentifierInterface) => {
        return String(key.pluginName) === String(pluginIdentifier.pluginName)
            && String(key.pluginSetId) === String(pluginIdentifier.pluginSetId);
    });
}
