import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input } from '@angular/core';
import { LoginService } from '../../../providers/login.service';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

@Component({
    selector: 'app-notification-modal',
    templateUrl: './notification-modal.component.html',
    styleUrls: ['./notification-modal.component.scss'],
    })
export class NotificationModalComponent {
    @Input() public userId: string;

    constructor(public activeModal: NgbActiveModal,
                private loginService: LoginService,
                private modalService: NgbModal) {
        this.loginService.isFromDashboard.subscribe((isFromDashboard: boolean) => {
            if (isFromDashboard) {
                this.activeModal.close();
            }
        });
    }

    public closeSystem(): void {
        this.loginService.logoutById(this.userId);
        this.activeModal.close();
    }

    public loginClicked(): void {
        const loginModal = this.modalService.open(LoginDialogComponent, {
            centered: true,
            windowClass: 'login-modal'
        });

        loginModal.componentInstance.systemId = this.userId;
    }
}
