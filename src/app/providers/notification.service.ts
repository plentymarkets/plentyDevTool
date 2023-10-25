import { Injectable } from '@angular/core';
import { NotificationType } from './enums/notificationType.enum';
import { ElectronService } from './electron.service';
import { EVENTS } from '../../constants';
import { LogService } from './log.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private electronService: ElectronService) {
        this.electronService.ipcRenderer.on(EVENTS.notification, (event, type, message) => {
            return NotificationService.createNotification(type, message);
        });
    }

    public static createNotification(title: NotificationType, message: string) {
        LogService.info('Notification', title, message);
        return new Notification(title, {
            body: message
        });
    }
}
