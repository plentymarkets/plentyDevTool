import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginService } from '../providers/login.service';
import { ElectronService } from '../providers/electron.service';
import { EVENTS } from '../../constants';

@Injectable({
    providedIn: 'root'
    })
export class IsLoggedInGuard implements CanActivate {

    constructor(private loginService: LoginService,
                private electronService: ElectronService,
                private router: Router
    ) {
    }

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.loginService.isLoggedIn()) {
            this.electronService.sendToMain(EVENTS.menu.toggleAllActions, true);
            return true;
        }

        this.electronService.sendToMain(EVENTS.menu.toggleAllActions, false);

        // noinspection JSIgnoredPromiseFromCall
        this.router.navigateByUrl('/login');
        return false;
    }

}
