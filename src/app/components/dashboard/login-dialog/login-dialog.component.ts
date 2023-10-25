import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginService } from '../../../providers/login.service';

@Component({
    selector: 'app-login-dialog',
    templateUrl: './login-dialog.component.html',
    styleUrls: ['./login-dialog.component.scss'],
    })

export class LoginDialogComponent {
    @Input() public systemId?: string;

    constructor(
        private modal: NgbActiveModal,
        private loginService: LoginService
    ) {
        this.loginService.isFromDashboard.subscribe((isFromDashboard: boolean) => {
            if (isFromDashboard) {
                this.modal.close();
            }
        });
    }

    public close () {
        this.modal.close();
    }
}
