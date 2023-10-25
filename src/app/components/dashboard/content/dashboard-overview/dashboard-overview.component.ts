import { ActivatedRoute, Data } from '@angular/router';
import { OnInit, Component } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-dashboard-overview',
    templateUrl: './dashboard-overview.component.html',
})
export class DashboardOverviewComponent implements OnInit {
    public routeData$: Observable<Data>;

    constructor(private route: ActivatedRoute) {}

    public ngOnInit(): void {
        this.routeData$ = this.route.data;
    }
}
