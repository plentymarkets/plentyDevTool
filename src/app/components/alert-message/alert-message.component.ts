import { Component } from '@angular/core';
import { AlertService } from '../../providers/alert.service';

@Component({
    selector: 'app-alert-message',
    templateUrl: './alert-message.component.html',
    styleUrls: ['./alert-message.component.scss'],
})
export class AlertMessageComponent {
    constructor(public alertService: AlertService) {}
}
