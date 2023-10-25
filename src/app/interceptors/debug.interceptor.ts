import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URLS } from '../../constants';

@Injectable({
    providedIn: 'root'
    })
export class DebugInterceptor implements HttpInterceptor {
    public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (request.url.startsWith(URLS.localVMUrl)) {
            request = request.clone({params: request.params.set('XDEBUG_SESSION_START', 'PHPSTORM')});
        }
        return next.handle(request);
    }
}
