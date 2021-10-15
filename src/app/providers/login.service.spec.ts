import { Router } from '@angular/router';
import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LoginService } from './login.service';
import { StorageService } from './storage.service';

import { CredentialsInterface } from './interfaces/credentials.interface';

import { credentialsInterfaceFactory } from './interfaces/credentials.interface.factory';
import { EVENTS, URLS } from '../../constants';
import { SyncService } from './sync.service';
import { ElectronService } from './electron.service';
import { LoginDataInterface } from './interfaces/loginData.interface';
import { loginDataInterfaceFactory } from './interfaces/loginData.interface.factory';

describe('LoginService', () => {
    let injector: TestBed;
    let loginService: LoginService;
    let httpMock: HttpTestingController;
    let routerSpy: jasmine.SpyObj<Router>;
    let mockCredentials: CredentialsInterface;
    let mockLoginResponse: LoginDataInterface;
    let syncServiceSpy: jasmine.SpyObj<SyncService>;
    let electronServiceSpy: jasmine.SpyObj<ElectronService>;
    let syncService: jasmine.SpyObj<SyncService>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        syncServiceSpy = jasmine.createSpyObj('SyncService', ['stop']);
        electronServiceSpy = jasmine.createSpyObj('ElectronService', ['sendToMain']);
        syncService = jasmine.createSpyObj('SyncService', ['resetAfterSwitch']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                LoginService,
                {provide: Router, useValue: routerSpy},
                {provide: SyncService, useValue: syncServiceSpy},
                {provide: ElectronService, useValue: electronServiceSpy},
                {provide: SyncService, useValue: syncService}
            ],
        });

        injector = getTestBed();
        httpMock = injector.get(HttpTestingController);
        loginService = injector.get(LoginService);
        mockCredentials = credentialsInterfaceFactory().build();
        mockLoginResponse = loginDataInterfaceFactory().build();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(loginService).toBeTruthy();
    });

    it('isLoggedIn returns true if user is logged in', () => {

        spyOn(StorageService, 'getUserData').and.returnValue(
            mockLoginResponse,
        );

        const isLoggedIn = loginService.isLoggedIn();

        expect(StorageService.getUserData).toHaveBeenCalled();

        expect(isLoggedIn).toBe(true);
    });

    it('isLoggedIn returns false if user is not logged in', () => {
        spyOn(StorageService, 'getUserData');

        const isLoggedIn = loginService.isLoggedIn();

        expect(StorageService.getUserData).toHaveBeenCalled();

        expect(isLoggedIn).toBe(false);
    });

    it('Loginresponse OK: StorageService writes tokens, redirects to dashboard', () => {
        spyOn(StorageService, 'setUserData');

        loginService.login(mockCredentials, null);

        const req = httpMock.expectOne(
            +mockCredentials.plentyId > 1000 ? URLS.login.cloud : URLS.login.local,
        );

        expect(req.request.method).toEqual('POST');

        expect(req.request.body).toEqual(mockCredentials);

        req.flush(mockLoginResponse);

        expect(syncService.resetAfterSwitch).toHaveBeenCalled();

        expect(StorageService.setUserData).toHaveBeenCalled();

        expect(electronServiceSpy.sendToMain).toHaveBeenCalledWith(
            EVENTS.menu.toggleAllActions,
            true
        );

        expect(routerSpy.navigate).toHaveBeenCalledWith([`/dashboard/${+mockCredentials.plentyId}/settings`]);
    });
});
