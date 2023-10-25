import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './providers/electron.service';
import { LogService } from './providers/log.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
    })
export class AppComponent implements OnInit {
    public appVersion = '';

    constructor(
        private translate: TranslateService,
        private electronService: ElectronService
    ) {
        translate.addLangs(['en', 'de']);
        translate.setDefaultLang('en');
    }

    public ngOnInit() {
        this.appVersion = this.electronService.remote.app.getVersion();
        LogService.setLogger(this.electronService.remote.require('electron-log'));
    }
}
