import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Data } from 'electron';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
    public routeData$: Observable<Data>;

    constructor(private route: ActivatedRoute) {}

    public ngOnInit(): void {
        this.routeData$ = this.route.data;
    }
}
