import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// NG Translate
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './providers/electron.service';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LeftBarComponent } from './components/dashboard/left-bar/left-bar.component';
import { NavBarComponent } from './components/dashboard/nav-bar/nav-bar.component';
import { ContentComponent } from './components/dashboard/content/content.component';
import { PathConfigComponent } from './components/dashboard/path-config/path-config.component';
import { SettingsComponent } from './components/dashboard/content/settings/settings.component';
import { LoginComponent } from './components/login/login.component';
import { DashHomeComponent } from './components/dashboard/content/dash-home/dash-home.component';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';
import { CatchErrorInterceptor } from './interceptors/catchError.interceptor';
import { DebugInterceptor } from './interceptors/debug.interceptor';
import { BusyModalComponent } from './components/dashboard/busy-modal/busy-modal.component';
import { LoginService } from './providers/login.service';
import { SyncService } from './providers/sync.service';
import { SyncSelectionService } from './providers/sync-selection.service';
import { LoginResolver } from './providers/resolvers/login.resolver';
import { DashboardOverviewComponent } from './components/dashboard/content/dashboard-overview/dashboard-overview.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { LoginDialogComponent } from './components/dashboard/login-dialog/login-dialog.component';
import { NotificationModalComponent } from './components/dashboard/notification-modal/notification-modal.component';
import { SortableDirective } from './providers/sortable.directive';
import { AlertMessageComponent } from './components/alert-message/alert-message.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const DRIVE_COMPONENTS = [
    AppComponent,
    AlertMessageComponent,

    DashboardComponent,
    LeftBarComponent,
    NavBarComponent,
    ContentComponent,
    PathConfigComponent,
    BusyModalComponent,
    LoginDialogComponent,
    NotificationModalComponent,

    DashboardOverviewComponent,
    DashHomeComponent,
    SettingsComponent,
    LoginFormComponent,
    LoginComponent,

    SortableDirective
];

const DRIVE_MODULES = [
    AppRoutingModule,
];

@NgModule({
    declarations: [
        DRIVE_COMPONENTS,
    ],
    imports: [
        DRIVE_MODULES,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (HttpLoaderFactory),
                deps: [HttpClient]
            }
        }),
    ],
    exports: [
        SortableDirective
    ],
    providers: [
        ElectronService,
        LoginService,
        SyncService,
        SyncSelectionService,
        LoginResolver,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthenticationInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CatchErrorInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: DebugInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
