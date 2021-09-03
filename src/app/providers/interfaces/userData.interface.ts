export interface UserDataInterface {
    id: number;
    realName: string;
    lang: string;
    isSupportUser: boolean;
    userId: number;
    oauthAccessTokensId: string;
    username: string;
    email: string;
    emailHash: string;
    timezone: string;
    disabled: number;
    userClass: number;
    userRoles: Array<any>;
    userRights: Array<any>;
}
