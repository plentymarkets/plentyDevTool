import { Injectable } from '@angular/core';
import {
    Resolve,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class LoginResolver implements Resolve<Object> {
    public resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Object | Observable<Object> | Promise<Object> {
        return route.parent.params['loginId'] !== null &&
            route.parent.params['loginId'] !== undefined
            ? route.parent.params['loginId']
            : null;
    }
}
