import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CredentialsInterface } from '../../providers/interfaces/credentials.interface';
import { LoginService } from '../../providers/login.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { StorageService } from '../../providers/storage.service';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
    })
export class LoginFormComponent implements OnInit {
    private cloudDe = 'cloudDe';
    private cloudIe = 'cloudIe';
    private ownCloud = 'ownCloud';
    private cloudDeLogin = 'https://plentymarkets-cloud-de.com/rest/login';
    private cloudIeLogin = 'https://plentymarkets-cloud-ie.com/rest/login';
    private textType = 'text';

    @Input() public systemId?: string;

    public credentials: CredentialsInterface = {
        plentyId: '',
        username: '',
        password: '',
        domain: this.cloudDeLogin
    };
    public credentialsDomain = this.cloudDe;
    public domains = [
        this.cloudDe,
        this.cloudIe,
        this.ownCloud
    ];
    public languages = this.translate.getLangs();
    public validationError = '';
    public validationErrorCloud = '';
    public showAdvanced = false;
    public ownCloudId: number;
    public passwordType = 'password';
    public passwordFieldType: string;

    constructor(
        private router: Router,
        public loginService: LoginService,
        public translate: TranslateService
    ) {
        if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation().previousNavigation === null
            && this.isFromDashboard() > 0) {
            this.goBack();
        }
    }

    public ngOnInit(): void {
        this.credentials.plentyId = this.systemId || '';
        this.passwordFieldType = this.passwordType;
    }

    public onSubmit(form: NgForm): void {
        if (!form.valid) {
            return;
        }

        if (this.showAdvanced) {
            switch (this.credentialsDomain) {
                case this.cloudDe:
                    this.credentials.domain = this.cloudDeLogin;
                    break;
                case this.cloudIe:
                    this.credentials.domain = this.cloudIeLogin;
                    break;
                case this.ownCloud:
                    const ownCloudId: string = this.ownCloudId < 10 ? `0${this.ownCloudId}` : `${this.ownCloudId}`;
                    this.credentials.domain = `https://plentymarkets-cloud-${ownCloudId}.com/rest/login`;
                    break;
                default:
                    break;
            }
        } else {
            this.credentials.domain = this.cloudDeLogin;
        }

        this.validationError = '';
        this.loginService.login(this.credentials, (error) => {
            if (error && error.error && error.error.error) {
                this.validationError = error.error.error;
                return;
            }
            this.translate
                .get('error.unknown')
                .subscribe((err: string) => this.validationError = err);
            this.translate
                .get('error.changeCloud')
                .subscribe((err: string) => this.validationErrorCloud = err);
        });
    }

    public goBack() {
        return this.router.navigate(['/dashboard', StorageService.getCurrentLoggedIn()]);
    }

    public isFromDashboard(): number {
        return StorageService.getAllUsers().length;
    }

    public _changePasswordFieldType(): void {
        this.passwordFieldType = this.passwordFieldType === this.passwordType ? this.textType : this.passwordType;
    }
}
