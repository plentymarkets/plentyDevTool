import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { IsLoggedInGuard } from './guards/isLoggedIn.guard';
import { LoginResolver } from './providers/resolvers/login.resolver';
import { DashboardOverviewComponent } from './components/dashboard/content/dashboard-overview/dashboard-overview.component';
import { SettingsComponent } from './components/dashboard/content/settings/settings.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard/:loginId',
        component: DashboardComponent,
        canActivate: [IsLoggedInGuard],
        children: [
            {
                path: '',
                component: DashboardOverviewComponent,
                resolve: {
                    loginId: LoginResolver
                }
            },
            {
                path: 'settings',
                component: SettingsComponent,
                resolve: {
                    loginId: LoginResolver
                }
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true})],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
