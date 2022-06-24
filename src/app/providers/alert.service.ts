import { AlertInterface } from './interfaces/alert.interface';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    public alerts: Array<AlertInterface> = [];

    public addAlert(type: string, message: HttpErrorResponse): void {
        this.alerts.push({
            type: type,
            message: message.error?.error?.message || message.error?.message
        });
    }

    public removeAlert(alert: AlertInterface): void {
        this.alerts.splice(this.alerts.indexOf(alert), 1);
    }

    public resetAlerts(): void {
        this.alerts = [];
    }
}
