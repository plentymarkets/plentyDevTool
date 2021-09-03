import * as fse from 'fs-extra';
import * as log from 'electron-log';
import * as path from 'path';
import { ipcRenderer } from 'electron';
import { SyncerOptionsInterface } from '../app/providers/interfaces/synceroptions.interface';
import { PathHelper } from './path-helper';
import { PluginIdentifierInterface } from '../app/providers/interfaces/pluginIdentifier.interface';
import { Database } from './database';
import { ChangeType } from '../app/providers/enums/changeType.enum';
import { DatabaseEntryInterface } from '../app/providers/interfaces/databaseEntry.interface';
import { FSWatcher, watch } from 'chokidar';
import { LocalChangeInterface } from '../app/providers/interfaces/localChange.interface';
import { EVENTS, WAIT_MILLISECONDS_BEFORE_PUBLISH_CHANGES_TO_UI } from '../constants';
import { IgnoreChecker } from './ignore-checker';
import { ContentChecker } from './content-checker';

export class Watcher {
    private watcher: FSWatcher;
    private initialScanComplete: boolean;
    private foundOnInitialScan: Array<{ path: string, mtime: number }>;
    private changes: Array<LocalChangeInterface>;
    private pathHelper: PathHelper;
    private notSyncedPlugins: Array<string>;
    private contentChecker: ContentChecker;
    private uiNotifiedAboutWorkInProgress = false;
    private currentPluginPath: string;
    private timestampOnStart: number;

    constructor(
        private userInterfaceWebContentsId: number,
        private database: Database,
        private options: SyncerOptionsInterface,
        private ignoreChecker: IgnoreChecker
    ) {
        this.contentChecker = new ContentChecker(database, options.syncPath);
        this.changes = [];
        this.pathHelper = new PathHelper(options.syncPath);
    }

    private static containsForbiddenCharacters(changePath: string): boolean {
        const containsAsciiCharacters: RegExp = new RegExp(/[\{^}%`\]">\[~<#|]/);
        const containsForbiddenCharacters: RegExp = new RegExp(/[^\x00-\x7F]/);
        const subPath = changePath.split(path.sep).splice(2).join('');

        if (containsForbiddenCharacters.test(subPath) || containsAsciiCharacters.test(subPath)) {
            return true;
        }

        return false;
    }

    private static getTimeStamp(stats: any) {
        return (stats && stats.mtime) ? Date.parse(stats.mtime) : null;
    }

    public start(timestamp: number): void {
        this.timestampOnStart = timestamp;
        log.debug('watcher start');
        this.stop();
        fse.ensureDirSync(this.options.syncPath);
        this.watcher = watch('.', {
            cwd: this.options.syncPath,
            persistent: true,
            ignored: this.ignoreChecker.returnList(),
            ignoreInitial: false,
            usePolling: process.platform !== 'darwin',
            interval: 3000,
            depth: 30
        })
            .on('add', (filePath: string, stats: Object) => this.onWatcherAdd(filePath, stats))
            .on('change', (filePath: string) => this.onWatcherChange(filePath))
            .on('unlink', (filePath: string) => this.onWatcherUnlink(filePath))
            .on('ready', () => this.onWatcherReady());
    }

    public stop(): void {
        if (this.watcher) {
            this.watcher.close();
        }
        this.watcher = null;
        this.initialScanComplete = false;
        this.foundOnInitialScan = [];
        this.notSyncedPlugins = [];
    }

    public getChanges(): Array<LocalChangeInterface> {
        return this.changes;
    }

    private onWatcherReady(): void {
        this.changes = [];
        this.initialScanComplete = true;
        const allDatabaseEntries = this.database.all(this.options.syncPath);

        for (const initialEntry of this.foundOnInitialScan) {
            if (this.isNewAction()) {
                break;
            }

            this.checkCurrentPath(initialEntry.path);
            const databaseEntry = allDatabaseEntries.find((dbEntry: DatabaseEntryInterface) => {
                return dbEntry.filePath === path.join(this.options.syncPath, initialEntry.path);
            });
            const containsForbiddenCharacters = Watcher.containsForbiddenCharacters(initialEntry.path);
            if (databaseEntry) {
                if (initialEntry.mtime > databaseEntry.timestamp && this.contentChecker.isContentChanged(initialEntry.path)) {
                    this.changes.push({
                        changeType: ChangeType.MODIFY,
                        path: initialEntry.path,
                        containsForbiddenCharacters
                    });
                }
            } else {
                this.changes.push({
                    changeType: ChangeType.ADD,
                    path: initialEntry.path,
                    containsForbiddenCharacters
                });
            }
        }

        for (const dbEntry of allDatabaseEntries) {
            if (this.isNewAction()) {
                break;
            }

            const databasePath: Array<string> = dbEntry.filePath.split(`${this.options.syncPath}/`);
            if (databasePath.length > 1) {
                this.checkCurrentPath(databasePath[1]);
            }
            if (this.s3KeyShouldBeSynced(this.pathHelper.s3KeyFromLocalPath(dbEntry.filePath))
                && !this.foundOnInitialScan.some((initialEntry: { path: string, mtime: number }) => {
                    return dbEntry.filePath === path.join(this.options.syncPath, initialEntry.path);
                })) {
                const changedPath = dbEntry.filePath.substring(this.options.syncPath.length + 1);
                this.changes.push({
                    changeType: ChangeType.DELETE,
                    path: changedPath,
                    containsForbiddenCharacters: Watcher.containsForbiddenCharacters(changedPath)
                });
            }
        }

        this.publishChanges();
        if (this.options.detectNewPlugins) {
            this.publishNotSyncedPlugins();
        }
    }

    private onWatcherAdd(filePath: string, stats: Object): void {
        if (this.localPathShouldBeSynced(filePath)) {
            if (this.initialScanComplete) {
                const mtime = Watcher.getTimeStamp(stats);
                const databaseEntry: DatabaseEntryInterface = this.database.getEntry(this.pathHelper.localPathFromS3Key(filePath));
                if (!mtime || !databaseEntry) {
                    this.addChange({
                        changeType: ChangeType.ADD,
                        path: filePath
                    });
                } else if (databaseEntry &&
                    mtime > databaseEntry.timestamp && databaseEntry.filePath &&
                    this.contentChecker.isContentChanged(databaseEntry.filePath, databaseEntry.checksum)
                ) {
                    this.addChange({
                        changeType: ChangeType.MODIFY,
                        path: filePath
                    });
                }
            } else {
                this.foundOnInitialScan.push({
                    path: filePath,
                    mtime: Watcher.getTimeStamp(stats)
                });
            }
        } else {
            if (
                this.options.detectNewPlugins &&
                !this.initialScanComplete &&
                path.basename(filePath) === 'plugin.json'
            ) {
                log.debug('Not synced "plugin.json" found');
                this.notSyncedPlugins.push(path.join(this.options.syncPath, filePath));
            }
        }
    }

    private onWatcherChange(filePath: string): void {
        if (this.localPathShouldBeSynced(filePath) &&
            this.contentChecker.isContentChanged(filePath)
        ) {
            this.addChange({
                changeType: ChangeType.MODIFY,
                path: filePath
            });
        }
    }

    private onWatcherUnlink(filePath: string): void {
        if (this.localPathShouldBeSynced(filePath)) {
            this.addChange({
                changeType: ChangeType.DELETE,
                path: filePath
            });
        }
    }

    private addChange(change: LocalChangeInterface): void {
        change.containsForbiddenCharacters = Watcher.containsForbiddenCharacters(change.path);
        const previousChange = this.changes.find((knownChange: LocalChangeInterface) => knownChange.path === change.path);
        if (previousChange) {
            this.handlePreviousChange(previousChange, change);
        } else {
            this.changes.push(change);
        }
        this.publishChanges();
    }

    private handlePreviousChange(previousChange: LocalChangeInterface, change: LocalChangeInterface): void {
        switch (previousChange.changeType) {
            case ChangeType.ADD: {
                if (change.changeType === ChangeType.DELETE) {
                    this.changes.splice(this.changes.indexOf(previousChange), 1);
                }
                break;
            }
            case ChangeType.MODIFY: {
                if (change.changeType === ChangeType.DELETE) {
                    this.changes.splice(this.changes.indexOf(previousChange), 1);
                }
                this.changes.push(change);
                break;
            }
            case ChangeType.DELETE: {
                this.changes.splice(this.changes.indexOf(previousChange), 1);
                change.changeType = ChangeType.MODIFY;
                this.changes.push(change);
                break;
            }
            default:
                break;
        }
    }

    private publishChanges(): void {
        const lastLocalChangeCount = this.changes.length;
        /**
         * push changes to the UI only if there are no new changes for 1s
         */
        const holdUIpush = setInterval(() => {
            if (lastLocalChangeCount === this.changes.length) {
                this.cleanUpChanges();
                const currentTimestamp: number = ipcRenderer.sendSync(EVENTS.watcher.currentTimestamp);
                const changes: Array<LocalChangeInterface> = currentTimestamp ? this.changes : [];

                ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.watcher.publishChanges, changes);
                this.uiNotifiedAboutWorkInProgress = false;
            } else if (!this.uiNotifiedAboutWorkInProgress) {
                ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.watcher.working);
                this.uiNotifiedAboutWorkInProgress = true;
            }
            clearInterval(holdUIpush);
        }, WAIT_MILLISECONDS_BEFORE_PUBLISH_CHANGES_TO_UI);
    }

    private cleanUpChanges(): void {
        this.removeDuplicateChanges();
        this.changes = this.changes.sort((a, b) => a.path < b.path ? -1 : 1);
    }

    private removeDuplicateChanges(): void {
        this.changes = this.changes.filter((value, index, changeList) => {
            return changeList.findIndex((knownChange) => knownChange.path === value.path) === index;
        });
    }

    private s3KeyShouldBeSynced(s3Key: string): boolean {
        if (this.ignoreChecker.isIgnored(s3Key)) {
            return false;
        }
        const currentPlugin = this.pathHelper.pluginIdentifierFromS3Key(s3Key);
        return s3Key && this.options.syncSelection.some((selectedPlugin: PluginIdentifierInterface) => {
            return String(currentPlugin.pluginName) === String(selectedPlugin.pluginName)
                && String(currentPlugin.pluginSetId) === String(selectedPlugin.pluginSetId);
        });
    }

    private localPathShouldBeSynced(localPath: string): boolean {
        if (!localPath.startsWith(this.options.syncPath)) {
            localPath = path.join(this.options.syncPath, localPath);
        }
        return this.s3KeyShouldBeSynced(this.pathHelper.s3KeyFromLocalPath(localPath));
    }

    private publishNotSyncedPlugins() {
        this.notSyncedPlugins = this.notSyncedPlugins.filter((pluginJSON: string) => {
            const directoryName = path.dirname(pluginJSON);
            const parsedPluginJson = fse.readJsonSync(pluginJSON);
            if (
                !parsedPluginJson ||
                !parsedPluginJson.hasOwnProperty('name') ||
                !parsedPluginJson.hasOwnProperty('namespace')
            ) {
                return false;
            }

            if (!directoryName.endsWith(path.sep + parsedPluginJson.name)) {
                return false;
            }

            return true;
        });

        log.debug('Not synced plugin.jsons found', this.notSyncedPlugins);

        ipcRenderer.sendTo(
            this.userInterfaceWebContentsId,
            EVENTS.watcher.notSyncedPlugins,
            this.notSyncedPlugins.map((pluginJSON: string) => {
                const parts = pluginJSON.split(path.sep);
                parts.pop(); // plugin.json
                return {
                    pluginName: parts.pop(),
                    pluginSetId: parts.pop()
                };
            }));
    }

    private checkCurrentPath(filePath: string): void {
        const correctPathRegex: RegExp = new RegExp(/^(\d+\/[a-zA-Z][a-zA-Z0-9]+\/)/);
        if (correctPathRegex.test(filePath) && filePath.split(correctPathRegex).length > 1
            && !this.isTheSamePath(filePath.split(correctPathRegex)[1])) {
            this.currentPluginPath = filePath.split(correctPathRegex)[1];
            ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.watcher.loadingPlugins, this.currentPluginPath.slice(0, -1));
        }
    }

    private isTheSamePath(pluginPath: string): boolean {
        return this.currentPluginPath === pluginPath;
    }

    private isNewAction(): boolean {
        const currentTimestamp: number = ipcRenderer.sendSync(EVENTS.watcher.currentTimestamp);

        return currentTimestamp && currentTimestamp !== this.timestampOnStart;
    }
}
