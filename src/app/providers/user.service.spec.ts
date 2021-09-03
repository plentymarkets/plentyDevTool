import { StorageService } from './storage.service';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { UserDataInterface } from './interfaces/userData.interface';
import { LoginDataInterface } from './interfaces/loginData.interface';
import { loginDataInterfaceFactory } from './interfaces/loginData.interface.factory';

describe('UserService', () => {
    let injector: TestBed;
    let userService: UserService;
    let httpMock: HttpTestingController;
    let mockLoginResponse: LoginDataInterface;
    const domain = 'http://master.plentymarkets.com';
    const loginId = '3';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [UserService],
        });
        injector = getTestBed();
        userService = injector.get(UserService);
        httpMock = injector.get(HttpTestingController);
        mockLoginResponse = loginDataInterfaceFactory().build();
    });

    it('should be created', () => {
        expect(userService).toBeTruthy();
    });

    it('get users informations #UserService.getUserData', () => {
        spyOn(StorageService, 'getUserData').and.returnValue(mockLoginResponse);

        const expectedUserData: UserDataInterface = {
            id: 3,
            realName: 'Test User',
            lang: 'de',
            isSupportUser: false,
            userId: 3,
            oauthAccessTokensId: '51dccd397aa070080637dadb9f1441ed',
            username: 'testuser',
            email: 'enter@mail.here',
            emailHash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
            timezone: 'Europe/Berlin',
            disabled: 0,
            userClass: 1,
            userRoles: [],
            userRights: [],
        };
        userService
            .getUserData(loginId)
            .subscribe((user: UserDataInterface) => {
                expect(user).toEqual(expectedUserData);
            });

        const req = httpMock.expectOne(domain + '/rest/authorized_user');
        expect(req.request.method).toBe('GET');
        req.flush(expectedUserData);
    });

    afterEach(() => {
        httpMock.verify();
    });
});
