import { Injectable } from '@angular/core';
import { StorageKey } from './enums/storageKey.enum';
import { LogService } from './log.service';
import { LoginDataInterface } from './interfaces/loginData.interface';

/*
 * This service wraps the local storage so that it can be easily
 * replaced by any other key value storage later, if required.
 */

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private static storageValues: Array<LoginDataInterface> = [];

    public static getItem(key: StorageKey, systemDependent = false) {
        const item = localStorage.getItem(
            systemDependent ? this.addPlentyId(key) : key
        );
        LogService.debug(
            'Get localstorage item',
            systemDependent ? this.addPlentyId(key) : key,
            item
        );
        return item;
    }

    public static setItem(
        key: StorageKey,
        value: string,
        systemDependent = false
    ) {
        LogService.debug(
            'Set localstorage item',
            systemDependent ? this.addPlentyId(key) : key,
            value
        );
        localStorage.setItem(
            systemDependent ? this.addPlentyId(key) : key,
            value
        );
    }

    public static removeItem(key: StorageKey, systemDependent = false) {
        LogService.debug(
            'Remove localstorage item',
            systemDependent ? this.addPlentyId(key) : key
        );
        localStorage.removeItem(systemDependent ? this.addPlentyId(key) : key);
    }

    public static clear() {
        localStorage.clear();
        LogService.debug('localstorage cleared');
    }

    public static setCurrentLoggedIn(id: string) {
        localStorage.setItem('currentUser', id);
    }

    public static getCurrentLoggedIn(): string | null {
        return localStorage.getItem('currentUser');
    }

    public static setUserData(loginData: LoginDataInterface) {
        this.storageValues = this.getStorageValueIfExists();
        const index: number = this.storageValues.findIndex(
            (data) => data.id === loginData.id
        );
        if (index > -1) {
            this.storageValues[index] = loginData;
        } else {
            this.storageValues.push(loginData);
        }

        LogService.debug('Set localstorage login data', loginData.id);
        localStorage.setItem(
            StorageKey.LOGIN_DATA,
            JSON.stringify(this.storageValues)
        );
    }

    public static getUserData(id: string) {
        LogService.debug('Get localstorage login data', id);
        const loginData: Array<LoginDataInterface> = JSON.parse(
            localStorage.getItem(StorageKey.LOGIN_DATA)
        );
        if (loginData) {
            const index: number = loginData.findIndex((data) => data.id === id);

            return loginData[index];
        }

        return null;
    }

    public static resetAllUsers() {
        LogService.debug('Reset localStorage login data');
        this.storageValues = [];
        this.setCurrentLoggedIn(null);
        localStorage.setItem(StorageKey.LOGIN_DATA, '[]');
    }

    public static resetUserById(id: string) {
        this.storageValues = this.getStorageValueIfExists();
        LogService.debug('Reset localStorage login data for', id);
        const index: number = this.storageValues.findIndex(
            (data) => data.id === id
        );
        if (index !== -1) {
            this.storageValues.splice(index, 1);
        }

        localStorage.setItem(
            StorageKey.LOGIN_DATA,
            JSON.stringify(this.storageValues)
        );
    }

    public static getAllUsers() {
        LogService.debug('Get localstorage users');
        const loginData: Array<LoginDataInterface> = JSON.parse(
            localStorage.getItem(StorageKey.LOGIN_DATA)
        );
        if (!loginData) {
            return [];
        }

        const usersIds: Array<string> = [];
        loginData.forEach((data: LoginDataInterface) => {
            usersIds.push(data.id);
        });

        return usersIds;
    }

    public static sortUsers(loggedInUsers: Array<string>) {
        const loginData: Array<LoginDataInterface> = JSON.parse(
            localStorage.getItem(StorageKey.LOGIN_DATA)
        );
        if (!loginData) {
            return;
        }

        const sortedLoginData: Array<LoginDataInterface> = [];
        loggedInUsers.forEach((userId: string) => {
            const userData: LoginDataInterface = loginData.find((data: LoginDataInterface) => data.id === userId);
            if (userData) {
                sortedLoginData.push(userData);
            }
        });

        localStorage.setItem(
            StorageKey.LOGIN_DATA,
            JSON.stringify(sortedLoginData)
        );
    }

    public static setSyncAttributes(
        id: string,
        syncPath: string,
        syncSelection: string
    ) {
        const syncValue: LoginDataInterface = {
            id: id,
            syncPath: syncPath,
            syncSelection: syncSelection ? syncSelection : '[]',
        };
        const syncArray: Array<LoginDataInterface> = this.getSyncAttributes();
        if (syncArray.length > 0) {
            const index: number = syncArray.findIndex((data) => data.id === id);
            if (index > -1) {
                if (syncPath) {
                    syncArray[index].syncPath = syncPath;
                }
                if (syncSelection) {
                    syncArray[index].syncSelection = syncSelection;
                }
            } else {
                syncArray.push(syncValue);
            }
        } else {
            syncArray.push(syncValue);
        }

        localStorage.setItem(
            StorageKey.SYNC_ATTRIBUTES,
            JSON.stringify(syncArray)
        );
    }

    public static getSyncAttributes() {
        return JSON.parse(localStorage.getItem(StorageKey.SYNC_ATTRIBUTES))
            ? JSON.parse(localStorage.getItem(StorageKey.SYNC_ATTRIBUTES))
            : [];
    }

    public static getSyncAttributesById(id: string) {
        const syncArray: Array<LoginDataInterface> = JSON.parse(
            localStorage.getItem(StorageKey.SYNC_ATTRIBUTES)
        );
        if (!syncArray) {
            return;
        }

        const index: number = syncArray.findIndex((data) => data.id === id);

        return index > -1 ? syncArray[index] : null;
    }

    public static addSyncPath(plentyId: string, path: string) {
        this.storageValues = this.getStorageValueIfExists();
        const index: number = this.storageValues.findIndex(
            (data) => data.id === plentyId
        );
        if (index > -1) {
            this.storageValues[index].syncPath = path;
        }

        LogService.debug('Set syncPath to', plentyId);
        localStorage.setItem(
            StorageKey.LOGIN_DATA,
            JSON.stringify(this.storageValues)
        );
    }

    public static addSyncSelection(plentyId: string, selection: string) {
        this.storageValues = this.getStorageValueIfExists();
        const index: number = this.storageValues.findIndex(
            (data) => data.id === plentyId
        );
        if (index > -1) {
            this.storageValues[index].syncSelection = selection;
        }

        LogService.debug('Set syncSelection to', plentyId);
        localStorage.setItem(
            StorageKey.LOGIN_DATA,
            JSON.stringify(this.storageValues)
        );
    }

    private static getStorageValueIfExists() {
        return JSON.parse(localStorage.getItem(StorageKey.LOGIN_DATA))
            ? JSON.parse(localStorage.getItem(StorageKey.LOGIN_DATA))
            : [];
    }

    private static addPlentyId(key: StorageKey) {
        return key + '_PID' + StorageService.getItem(StorageKey.PLENTY_ID);
    }
}
