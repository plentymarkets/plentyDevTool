import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LogService } from './log.service';

@Injectable({
    providedIn: 'root',
})
export class OnlineStatusService {
    private readonly onlineStatus: BehaviorSubject<boolean>;

    constructor() {
        this.onlineStatus = new BehaviorSubject<boolean>(false);
        this.initEventListener();
    }

    public getOnlineStatus() {
        return this.onlineStatus;
    }

    private initEventListener() {
        window.addEventListener('offline', () => {
            this.onlineStatus.next(false);
            LogService.info('offline');
        });
        window.addEventListener('online', () => {
            this.onlineStatus.next(true);
            LogService.info('online');
        });
    }
}
