import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    public loginId: string;
    public routeParams$: Observable<Params>;

    constructor(
        private route: ActivatedRoute
    ) {
    }

    public ngOnInit(): void {
        this.routeParams$ = this.route.params;
    }
}
