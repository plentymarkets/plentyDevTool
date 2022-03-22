import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CredentialsInterface } from './interfaces/credentials.interface';
import { LoginResponseInterface } from './interfaces/loginResponse.interface';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { EVENTS, URLS } from '../../constants';
import { SyncService } from './sync.service';
import { PluginService } from './plugin.service';
import { LogService } from './log.service';
import { ElectronService } from './electron.service';
import { LoginDataInterface } from './interfaces/loginData.interface';
import { StorageKey } from './enums/storageKey.enum';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LoginService {
    public isFromDashboard: BehaviorSubject<boolean>;
    public isLoginLoading: boolean = false;
    private loginId: string;

    constructor(
        private ngZone: NgZone,
        private httpClient: HttpClient,
        private router: Router,
        private syncService: SyncService,
        private pluginService: PluginService,
        private electronService: ElectronService
    ) {
        this.isFromDashboard = new BehaviorSubject(false);
    }

    public logout() {
        StorageService.resetAllUsers();
        this.syncService.stop();
        this.syncService.resetSubjects();
        this.pluginService.resetList();

        this.electronService.sendToMain(EVENTS.menu.toggleAllActions, false);

        this.ngZone.run(() => {
            this.router.navigateByUrl('/login');
        });
    }

    public logoutById(loginId: string) {
        StorageService.resetUserById(loginId);
        const users: Array<string> = StorageService.getAllUsers();

        if (users.length > 0) {
            this.switchUserById(users[0]);
        } else {
            this.router.navigateByUrl('/login');
        }
    }

    public isLoggedIn() {
        this.loginId = StorageService.getCurrentLoggedIn();

        return !!(
            StorageService.getUserData(this.loginId) &&
            StorageService.getUserData(this.loginId).accessToken
        );
    }

    public login(
        credentials: CredentialsInterface,
        cb: (error: HttpErrorResponse) => void
    ) {
        this.isLoginLoading = true;
        this.httpClient
            .post<LoginResponseInterface>(
                +credentials.plentyId > 1000
                    ? credentials.domain
                    : URLS.login.local,
                credentials
            )
            .subscribe(
                (loginResponse: LoginResponseInterface) => {
                    if (
                        loginResponse &&
                        loginResponse.accessToken &&
                        loginResponse.domain
                    ) {
                        this.syncService.resetAfterSwitch();

                        const userData: LoginDataInterface = StorageService.getSyncAttributesById(
                            credentials.plentyId
                        );
                        const syncPath =
                            userData &&
                            userData.syncPath !== null &&
                            userData.syncPath !== undefined &&
                            userData.syncPath !== ''
                                ? userData.syncPath
                                : StorageService.getItem(StorageKey.SYNC_PATH);
                        let syncSelection = userData
                            ? userData.syncSelection
                            : null;

                        if (
                            StorageService.getItem(StorageKey.PLENTY_ID) ===
                            credentials.plentyId
                        ) {
                            syncSelection = StorageService.getItem(
                                StorageKey.SYNC_SELECTION,
                                true
                            );
                            StorageService.setItem(StorageKey.PLENTY_ID, null);
                        }
                        const loginData: LoginDataInterface = {
                            id: credentials.plentyId,
                            accessToken: loginResponse.accessToken,
                            domain: loginResponse.domain,
                            syncPath: syncPath,
                            syncSelection: syncSelection,
                        };
                        StorageService.setCurrentLoggedIn(credentials.plentyId);
                        StorageService.setUserData(loginData);
                        StorageService.setSyncAttributes(
                            credentials.plentyId,
                            syncPath,
                            syncSelection
                        );
                        StorageService.setItem(StorageKey.SYNC_PATH, syncPath);

                        let initPath = `/dashboard/${credentials.plentyId}`;
                        if (!syncPath || syncPath === 'null' || syncPath.length <= 0) {
                            initPath = `/dashboard/${credentials.plentyId}/settings`;
                        }

                        LogService.info(
                            'Logged in to plentyID',
                            credentials.plentyId
                        );
                        this.electronService.sendToMain(
                            EVENTS.menu.toggleAllActions,
                            true
                        );
                        // noinspection JSIgnoredPromiseFromCall
                        if (this.router.url === initPath) {
                            this.router.routeReuseStrategy.shouldReuseRoute = () => false;
                            this.router.onSameUrlNavigation = 'reload';
                        }
                        this.router.navigate([initPath]);
                        this.isFromDashboard.next(true);
                        this.isLoginLoading = false;
                    }
                },
                // status 401
                (error: HttpErrorResponse) => {
                    LogService.info('Login error', error);
                    cb(error);
                    this.isLoginLoading = false;
                }
            );
    }

    public switchUserById(id: string) {
        if (id === StorageService.getCurrentLoggedIn()) {
            return;
        }

        StorageService.setCurrentLoggedIn(id);
        const userData: LoginDataInterface = StorageService.getUserData(id);
        const syncPath = userData ? userData.syncPath : undefined;
        let initPath: String = `/dashboard/${id}`;

        if (!syncPath || syncPath.length <= 0) {
            initPath = `/dashboard/${id}/settings`;
        }

        this.electronService.sendToMain(EVENTS.menu.toggleAllActions, true);
        this.syncService.resetAfterSwitch();
        this.router.navigate([initPath]);
    }
}
