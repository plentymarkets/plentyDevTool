import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as micromatch from 'micromatch';
import * as log from 'electron-log';
import { IGNOREFILE } from '../constants';

export class IgnoreChecker {
    private patternList: Array<string>;

    constructor(private syncPath: string) {
        this.readIgnorefile();
    }

    private readIgnorefile() {
        this.patternList = [];
        const ignoreFilePath = path.join(this.syncPath.substring(0, this.syncPath.lastIndexOf(path.sep)), IGNOREFILE.name);
        try {
            fs.accessSync(ignoreFilePath, fs.constants.F_OK);
        } catch (e) {
            log.debug('Ignore file not found');
            const defaultContent = IGNOREFILE.content.reduce(((previousValue, currentValue) => {
                return previousValue + currentValue + '\n';
            }), '');
            fse.outputFileSync(ignoreFilePath, defaultContent);
            log.debug('Ignore file created');
        }
        fs.readFileSync(ignoreFilePath).toString().split('\n').forEach((line: string) => {
            if (line.length > 0 && !line.startsWith('#')) {
                this.patternList.push(line);
            }
        });
        log.info('ignore patterns', this.patternList);
    }

    public returnList() {
        return this.patternList;
    }
    public isIgnored(filePath: string) {
        // Keep slash in front of directories
        const regExp = filePath.indexOf('/') === filePath.lastIndexOf('/') ? /\w+\/\w+\// : /\w+\/\w+/;
        return micromatch.any(
            filePath.replace(regExp, ''),
            this.patternList,
            {
                dot: true
            }
        );
    }
}
