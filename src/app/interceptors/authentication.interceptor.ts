import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { StorageService } from '../providers/storage.service';
import { LoginDataInterface } from '../providers/interfaces/loginData.interface';

@Injectable({
    providedIn: 'root',
    })
export class AuthenticationInterceptor implements HttpInterceptor {
    public intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const loginId: string = StorageService.getCurrentLoggedIn();
        const userData: LoginDataInterface = StorageService.getUserData(
            loginId
        );
        if (userData) {
            const accessToken = StorageService.getUserData(loginId).accessToken;
            const domain = StorageService.getUserData(loginId).domain;

            if (accessToken && domain && request.url.startsWith(domain)) {
                /*
                 * do this only if it is the url of the plenty system,
                 * so that the token is not passed on to external systems!!!
                 */
                request = request.clone({
                    headers: request.headers.set(
                        'Authorization',
                        'Bearer ' + accessToken
                    ),
                });
            }
        }

        return next.handle(request);
    }
}
