import { Component, OnChanges, Input } from '@angular/core';
import { shell } from 'electron';
import { StorageService } from '../../../providers/storage.service';
import { UserService } from '../../../providers/user.service';
import { UserDataInterface } from '../../../providers/interfaces/userData.interface';
import { LoginService } from '../../../providers/login.service';
import { Router } from '@angular/router';
import { SyncSelectionService } from '../../../providers/sync-selection.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationModalComponent } from '../notification-modal/notification-modal.component';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnChanges {
    public domain: string;
    public gravatar =
        'https://www.gravatar.com/avatar/12345678901234567890123456789012?d=mm';
    public isCollapsed = false;
    public webstoreName: string;
    public loggedInUsers: Array<string> = [];
    public isLoaded = false;
    @Input() public loginId: string;

    constructor(
        private userService: UserService,
        private router: Router,
        private modalService: NgbModal,
        public loginService: LoginService,
        public syncSelectionService: SyncSelectionService
    ) {}

    public ngOnChanges(): void {
        this.isLoaded = false;
        this.initData();
    }

    public toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
    }

    public openExternalLink(domain: string) {
        shell.openExternal(domain);
    }

    public isDashboardActive() {
        return this.router.url === `/dashboard/${this.loginId}`;
    }

    public isSettingsActive() {
        return this.router.url === `/dashboard/${this.loginId}/settings`;
    }

    public openDialog(): void {
        this.modalService.open(LoginDialogComponent, {
            centered: true,
            windowClass: 'login-modal'
        });
    }

    public switchUserById(id: string): void {
        const users: Array<string> = StorageService.getAllUsers();
        const index: number = users.findIndex((user) => user === id);
        if (index !== -1) {
            this.loginService.switchUserById(id);
        } else {
            this.loggedInUsers = users;
        }
    }

    public orderChanged(systemTabs: Array<string>): void {
        StorageService.sortUsers(systemTabs);
        this.loggedInUsers = systemTabs;
    }

    private initData(): void {
        this.domain = StorageService.getUserData(this.loginId).domain;
        this.webstoreName = this.domain.replace(/^https?:\/\/(www\.)?/, '');
        this.loggedInUsers = StorageService.getAllUsers();
        this.userService.getUserData(this.loginId).subscribe(
            (userData: UserDataInterface) => {
                if (
                    userData &&
                    userData.emailHash &&
                    userData.emailHash.length > 0
                ) {
                    this.gravatar =
                        'https://www.gravatar.com/avatar/' +
                        userData.emailHash +
                        '?d=mm';
                }
                this.isLoaded = true;
            },
            (errorResponse: HttpErrorResponse) => {
                if (errorResponse.status === 401) {
                    const ref = this.modalService.open(NotificationModalComponent, {
                        backdrop: 'static',
                        centered: true,
                        windowClass: 'notification-modal',
                    });
                    ref.componentInstance.userId = this.loginId;
                }
                this.isLoaded = true;
            }
        );
    }
}
