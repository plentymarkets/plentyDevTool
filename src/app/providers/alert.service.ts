import { AlertInterface } from './interfaces/alert.interface';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    public alerts: Array<AlertInterface> = [];
    public $newAlert: Subject<void> = new Subject<void>();

    public addAlert(type: string, message: HttpErrorResponse): void {
        this.alerts.push({
            type: type,
            message: message.error?.error?.message || message.error?.message || message
        });
        this._notifyAlert();
    }

    public addAlertString(type: string, message: string): void {
        this.alerts.push({
            type: type,
            message: message
        });
        this._notifyAlert();
    }

    public removeAlert(alert: AlertInterface): void {
        this.alerts.splice(this.alerts.indexOf(alert), 1);
        this._notifyAlert();
    }

    public resetAlerts(): void {
        this.alerts = [];
        this._notifyAlert();
    }

    private _notifyAlert(): void {
        this.$newAlert.next();
    }
}
