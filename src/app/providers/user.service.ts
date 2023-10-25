import { Injectable } from '@angular/core';
import { UserDataInterface } from './interfaces/userData.interface';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ROUTES } from '../../constants';
import { StorageService } from './storage.service';

/*
 * This service get data of the authorized user
 */

@Injectable({
    providedIn: 'root'
    })
export class UserService {

    constructor(private http: HttpClient) {
    }

    public getUserData(loginId: string): Observable<UserDataInterface> {
        const url = StorageService.getUserData(loginId).domain + ROUTES.getAuthorizedUser;

        return this.http.get<UserDataInterface>(url);
    }
}
