import { ChangeType } from '../enums/changeType.enum';

export interface LocalChangeInterface {
    path: string;
    changeType: ChangeType;
    containsForbiddenCharacters?: boolean;
}
