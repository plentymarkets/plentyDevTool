import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as request from 'request';
import * as unzip from 'extract-zip';
import * as log from 'electron-log';
import { ipcRenderer } from 'electron';
import { SyncJobEntryInterface } from '../app/providers/interfaces/syncJob.interface';
import { EVENTS, ROUTES, URLS } from '../constants';
import { SyncerOptionsInterface } from '../app/providers/interfaces/synceroptions.interface';
import { S3ObjectInterface } from '../app/providers/interfaces/s3Object.interface';
import { PluginIdentifierInterface } from '../app/providers/interfaces/pluginIdentifier.interface';
import { SyncType } from '../app/providers/enums/syncType.enum';
import { Database } from './database';
import { PathHelper } from './path-helper';
import { DatabaseEntryInterface } from '../app/providers/interfaces/databaseEntry.interface';
import { Watcher } from './watcher';
import { LocalChangeInterface } from '../app/providers/interfaces/localChange.interface';
import { ChangeType } from '../app/providers/enums/changeType.enum';
import { NotificationType } from '../app/providers/enums/notificationType.enum';
import { CommitResponse, CommitResult } from '../app/providers/interfaces/commitResponse.interface';
import { IgnoreChecker } from './ignore-checker';
import { Lockfile } from './lockfile';

export class Syncer {
    private jobQueue: Array<SyncJobEntryInterface>;
    private options: SyncerOptionsInterface;
    private readonly database: Database;
    private pathHelper: PathHelper;
    private watcher: Watcher;
    private ignoreChecker: IgnoreChecker;
    private authenticatedRequest: any;
    private changesToCommit: Array<string>;
    private lockfile: Lockfile;
    private untouchedObjectList: Array<S3ObjectInterface>;
    private userInterfaceWebContentsId: number;

    constructor() {
        this.database = new Database();
        this.initEvents();
    }

    public pull(timestamp: number) {
        this.jobQueue = [];
        this.changesToCommit = [];
        log.warn('Make use of object filter');
        this.authenticatedRequest.get(
            ROUTES.files.getObjectList,
            {}, // TODO add filter
            (error, response, body) => {
                if (error) {
                    log.error(error);
                    return;
                }
                const parsedBody = JSON.parse(body);
                if (!parsedBody.hasOwnProperty('objects')) {
                    log.error('No object list received', body);
                    throw new Error('No object list received');
                }
                this.watcher.stop();
                let objectList: Array<S3ObjectInterface> = parsedBody.objects;
                objectList = objectList.map((object: S3ObjectInterface) => {
                    object.key = decodeURIComponent((object.key + '').replace(/\+/g, '%20'));
                    return object;
                });
                objectList = objectList.filter((object: S3ObjectInterface) => {
                    return !this.ignoreChecker.isIgnored(object.key) && !object.key.endsWith('/');
                });

                const allDatabaseEntries = this.getNotIgnoredDatabaseEntries();

                this.untouchedObjectList = objectList.slice(0);
                objectList = this.addZipDownloadJobs(objectList);
                this.addDeleteLocalJobs(objectList, allDatabaseEntries);
                this.addDownloadJobs(objectList, allDatabaseEntries);

                ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.start, this.jobQueue.length);

                log.debug('start pulling', this.jobQueue);
                this.startNextJob(timestamp);
            });
    }

    public push(timestamp: number) {
        this.jobQueue = [];
        const remoteDeletions = [];
        this.changesToCommit = [];
        this.watcher.stop();
        this.watcher.getChanges().forEach((change: LocalChangeInterface) => {
            if (!change.containsForbiddenCharacters) {
                const s3Key = change.path.replace(new RegExp(/\\/, 'g'), '/');
                if (change.changeType === ChangeType.DELETE) {
                    remoteDeletions.push(s3Key);
                } else {
                    this.jobQueue.push({
                        s3Key: s3Key,
                        syncType: SyncType.UPLOAD
                    });
                }
                this.changesToCommit.push(s3Key);
            } else {
                log.info('Not pushed due to forbiddenCharacters', change);
            }
        });

        if (remoteDeletions && remoteDeletions.length > 0) {
            // noinspection JSUnusedLocalSymbols
            this.authenticatedRequest.delete(
                ROUTES.files.deleteObjects,
                {
                    body: remoteDeletions,
                    json: true
                },
                (error, response, body) => {
                    if (error) {
                        log.error('Error pushing remote deletions', error, remoteDeletions);
                        throw error;
                    }
                    remoteDeletions.forEach((deletion: string) => this.database.removeFile(this.pathHelper.localPathFromS3Key(deletion)));
                    ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.start, this.jobQueue.length);
                    log.debug('start pushing', this.jobQueue);
                    this.startNextJob(timestamp);
                }
            );
        } else {
            ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.start, this.jobQueue.length);
            log.debug('start pushing', this.jobQueue);
            this.startNextJob(timestamp);
        }
    }

    private getNotIgnoredDatabaseEntries() {
        return this.database.all(this.options.syncPath).filter((databaseEntry: DatabaseEntryInterface) => {
            return !this.ignoreChecker.isIgnored(this.pathHelper.s3KeyFromLocalPath(databaseEntry.filePath));
        });
    }

    /*
     * TODO: make use of this filter
     */

    // noinspection JSUnusedLocalSymbols
    private getGetObjectListRoute() {
        return ROUTES.files.getObjectList + this.options.syncSelection.map((selectedPlugin: PluginIdentifierInterface, index: number) => {
            return `${index === 0 ? '?' : '&'}plugin_sets[${selectedPlugin.pluginSetId}][]=${selectedPlugin.pluginName}`;
        }).reduce(((previousValue, currentValue) => previousValue + currentValue), '');
    }

    private commitChangedFiles() {
        if (Array.isArray(this.changesToCommit) && this.changesToCommit.length > 0) {
            this.authenticatedRequest.post(
                ROUTES.files.commitUploads,
                {
                    body: this.changesToCommit,
                    json: true
                },
                (error, response, body: CommitResponse) => {
                    if (error) {
                        log.error('Error committing changed files', error);
                        throw new Error('Error committing changed files');
                    }
                    const buildErrors: Array<string> = [];
                    try {
                        if (!body.successful) {
                            body.result.forEach((resultEntry: CommitResult) => {
                                resultEntry.plugin_compile.forEach((compileError: string) => {
                                    buildErrors.push(compileError);
                                });
                            });
                        }
                        const buildExecuted = Array.isArray(body.executedBuilds) && body.executedBuilds.length > 0;
                        log.info(`Build executed: ${buildExecuted}, build errors: ${buildErrors}`);
                        ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.syncer.buildErrors, buildExecuted, buildErrors);
                    } catch (e) {
                        log.error(`Commit changed files errors: ${e.message}`);
                        throw new Error('Error committing changed files');
                    }
                }
            );
        }
    }

    private startNextJob(timestamp: number) {
        const job = this.jobQueue.shift(); // TODO make some parallel jobs

        ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.progress, this.jobQueue.length + 1, job);

        if (!job) {
            this.lockfile.remove();
            this.commitChangedFiles();
            this.removeEmptyDirectories(this.options.syncPath);
            this.watcher.start(timestamp);
            log.info('Queue empty');
            ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.finished);
            return;
        }

        log.info(this.jobQueue.length + 1, job.syncType, job.s3Key);

        this.lockfile.write(job);
        switch (job.syncType) {
            case SyncType.DOWNLOAD_SINGLE_FILE: {
                this.downloadFile(job, timestamp);
                break;
            }
            case SyncType.DOWNLOAD_PLUGIN_ZIP: {
                this.downloadPluginZip(job, timestamp);
                break;
            }
            case SyncType.UPLOAD: {
                this.upload(job, timestamp);
                break;
            }
            case SyncType.DELETE_LOCAL: {
                this.deleteLocalFile(job, timestamp);
                break;
            }
            default: {
                throw new Error('Unknown job');
            }
        }
    }

    private addDownloadJobs(objectList: Array<S3ObjectInterface>, allDatabaseEntries: Array<DatabaseEntryInterface>) {
        objectList.forEach((s3Object: S3ObjectInterface) => {
            if (this.fileShouldBeSynced(s3Object)) {
                const databaseEntry = allDatabaseEntries.find((dbEntry: DatabaseEntryInterface) => {
                    return dbEntry.filePath === this.pathHelper.localPathFromS3Key(s3Object.key);
                });
                if (!databaseEntry || Date.parse(s3Object.lastModified) > databaseEntry.timestamp) {
                    if (this.watcher.getChanges().some((localChange: LocalChangeInterface) => {
                        return localChange.changeType !== ChangeType.DELETE &&
                            localChange.path.replace(new RegExp(/\\/, 'g'), '/') === s3Object.key;
                    })) {
                        const filePath = this.pathHelper.localPathFromS3Key(s3Object.key);
                        const index = filePath.lastIndexOf(path.sep) + 1;
                        const newFilePath = filePath.slice(0, index) + `BACKUP_${+new Date()}_` + filePath.slice(index);
                        fs.renameSync(filePath, newFilePath);
                        log.info(`File ${filePath} renamed to ${newFilePath}`);
                    }
                    this.jobQueue.push({
                        s3Key: s3Object.key,
                        syncType: SyncType.DOWNLOAD_SINGLE_FILE
                    });
                }
                else if (databaseEntry && this.watcher.getChanges().some((localChange: LocalChangeInterface) => {
                    return databaseEntry.filePath.includes(localChange.path) && localChange.changeType === ChangeType.DELETE;
                })) {
                    this.jobQueue.push({
                        s3Key: s3Object.key,
                        syncType: SyncType.DOWNLOAD_SINGLE_FILE
                    });
                }
            }
        });
    }

    private addDeleteLocalJobs(s3Objects: Array<S3ObjectInterface>, allDatabaseEntries: Array<DatabaseEntryInterface>) {
        allDatabaseEntries.filter((dbEntry: DatabaseEntryInterface) => {
            const s3Key = this.pathHelper.s3KeyFromLocalPath(dbEntry.filePath);
            if (s3Key === null || !this.options.syncSelection.some((pluginIdentifier: PluginIdentifierInterface) => {
                return s3Key.startsWith(`${pluginIdentifier.pluginSetId}/${pluginIdentifier.pluginName}/`);
            })) {
                return false;
            }

            return !s3Objects.some((s3Object: S3ObjectInterface) => {
                return s3Object.key === s3Key;
            });
        }).forEach((entryToDelete: DatabaseEntryInterface) => {
            this.jobQueue.push({
                s3Key: this.pathHelper.s3KeyFromLocalPath(entryToDelete.filePath),
                syncType: SyncType.DELETE_LOCAL
            });
        });
    }

    private fileShouldBeSynced(s3Object: S3ObjectInterface) {
        const pluginKey = this.pathHelper.pluginIdentifierFromS3Key(s3Object.key);
        return this.options.syncSelection.some((selectedPluginKey: PluginIdentifierInterface) => {
            return pluginKey.pluginSetId === String(selectedPluginKey.pluginSetId)
                && pluginKey.pluginName === selectedPluginKey.pluginName;
        });
    }

    private addZipDownloadJobs(objectList: Array<S3ObjectInterface>) {
        let keyStart: RegExpExecArray;
        let keyList = [];
        objectList.forEach((s3Object: S3ObjectInterface) => {
            keyStart = /\w+\/\w+\//.exec(s3Object.key);
            if (Array.isArray(keyStart)) {
                keyList.push(keyStart[0]);
            }
        });
        keyList = keyList.filter((value, index, arr) => arr.indexOf(value) === index);
        keyList = keyList.filter((key: string) => {
            return this.options.syncSelection.some((pluginIdentifier: PluginIdentifierInterface) => {
                return key.startsWith(`${pluginIdentifier.pluginSetId}/${pluginIdentifier.pluginName}/`);
            });
        });

        keyList.forEach((key: string) => {
            if (!fs.existsSync(path.join(this.options.syncPath, key))) {
                objectList = objectList.filter((s3Object: S3ObjectInterface) => !s3Object.key.startsWith(key));
                this.jobQueue.push({
                    s3Key: key,
                    syncType: SyncType.DOWNLOAD_PLUGIN_ZIP
                });
            }
        });

        return objectList;
    }

    private initEvents() {
        ipcRenderer.on(EVENTS.syncer.init, (event, options: SyncerOptionsInterface) => {
            log.debug('initEvents');
            this.userInterfaceWebContentsId = event.senderId;
            if (!this.userInterfaceWebContentsId) {
                const errorMessage = 'No userInterfaceWebContentsId set for syncer';
                log.error(errorMessage);
                throw new Error(errorMessage);
            }

            this.init(options);
        });
        ipcRenderer.on(EVENTS.syncer.stop, () => this.stop());
        ipcRenderer.on(EVENTS.syncer.pull, (event, {timestamp}) => this.pull(timestamp));
        ipcRenderer.on(EVENTS.syncer.push, (event, {timestamp}) => this.push(timestamp));
        ipcRenderer.on(EVENTS.syncer.installPlugin, (event, plugin: PluginIdentifierInterface) => this.installPlugin(plugin));
    }

    private init(options: SyncerOptionsInterface) {
        log.debug('Init syncer', options);
        if (this.ignoreChecker === null || this.ignoreChecker === undefined ||
            (this.options && this.options.syncPath !== options.syncPath)) {
            this.ignoreChecker = new IgnoreChecker(options.syncPath);
        }
        this.options = options;
        this.pathHelper = new PathHelper(options.syncPath);
        this.authenticatedRequest = request.defaults({
            headers: {'Authorization': 'Bearer ' + options.accessToken},
            baseUrl: options.systemURL,
            qs: options.systemURL.startsWith(URLS.localVMUrl) ? {XDEBUG_SESSION_START: 'PHPSTORM'} : null
        });
        this.lockfile = new Lockfile(options.syncPath);
        this.checkNotFinishedJobs();
        this.stop();
        this.watcher = new Watcher(
            this.userInterfaceWebContentsId,
            this.database,
            options,
            this.ignoreChecker
        );

        ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.watcher.publishChanges, []);
        this.watcher.start(options.timestamp);
    }

    private stop() {
        if (this.watcher) {
            this.watcher.stop();
        }
    }

    private removeEmptyDirectories(directory: string) {
        if (!fs.statSync(directory).isDirectory()) {
            return;
        }

        let files = fs.readdirSync(directory);
        if (files.length > 0) {
            files.forEach((file) => {
                this.removeEmptyDirectories(path.join(directory, file));
            });
            files = fs.readdirSync(directory);
        }

        if (files.length === 0) {
            log.debug('Remove empty directory', directory);
            fs.rmdirSync(directory);
            return;
        }
    }

    private downloadPluginZip(job: SyncJobEntryInterface, timestamp: number) {
        const pluginIdentifier = this.pathHelper.pluginIdentifierFromS3Key(job.s3Key);
        const localFilepath = path.join(
            this.options.syncPath,
            pluginIdentifier.pluginSetId,
            pluginIdentifier.pluginName,
            pluginIdentifier.pluginName + '.zip'
        );
        fse.ensureDir(path.dirname(localFilepath))
            .then(() => {
                this.authenticatedRequest.get(
                    ROUTES.files.getPluginZip,
                    {
                        qs: {
                            plugin_set: pluginIdentifier.pluginSetId,
                            plugin: pluginIdentifier.pluginName
                        },
                    })
                    .pipe(fs.createWriteStream(localFilepath).on('close', () => {
                        this.unzip(localFilepath, timestamp, (error) => {
                            log.error('Error downloading/extracting zip file', localFilepath, error);
                            const dirToRemove = this.pathHelper.pluginDirectoryFromS3Key(job.s3Key);
                            fse.removeSync(dirToRemove);
                            log.debug('directory removed', dirToRemove);

                            const singleObjects = this.untouchedObjectList.filter((s3Object: S3ObjectInterface) => {
                                return s3Object.key.startsWith(`${pluginIdentifier.pluginSetId}/${pluginIdentifier.pluginName}/`);
                            });
                            this.addDownloadJobs(singleObjects, this.getNotIgnoredDatabaseEntries());
                            ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.start, this.jobQueue.length);

                            this.startNextJob(timestamp);
                        });
                    }));
            });
    }

    private unzip(localFilePath: string, timestamp: number, cb) {
        unzip(localFilePath, {dir: path.dirname(localFilePath)}).then((() => {
            log.debug('Unzipped', localFilePath);
            fse.remove(localFilePath).then(() => {
                const fileList = this.getFileList(path.dirname(localFilePath));
                log.debug('Add unzipped files to database', fileList);
                fileList.forEach((filePath: string) => this.database.addFile(filePath));
                this.startNextJob(timestamp);
            });
        })).catch((error: Error) => cb(error));
    }

    private getFileList(directoryPath: string, filePathList = []) {
        const files = fs.readdirSync(directoryPath);
        files.forEach((file: string) => {
            const filePath = path.join(directoryPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                filePathList = this.getFileList(filePath, filePathList);
            } else {
                filePathList.push(filePath);
            }
        });
        return filePathList;
    }

    private downloadFile(job: SyncJobEntryInterface, timestamp: number) {
        const localFilename = this.pathHelper.localPathFromS3Key(job.s3Key);
        fse.ensureDir(path.dirname(localFilename))
            .then(() => {
                this.authenticatedRequest.get(
                    ROUTES.files.getObjectDownloadURL,
                    {
                        qs: {
                            key: job.s3Key
                        }
                    },
                    (error, response, body) => {
                        if (error) {
                            const msg = 'Error downloading file';
                            log.error(msg);
                            throw new Error(msg);
                        }
                        request.get(body).pipe(fs.createWriteStream(localFilename).on('close', () => {
                            this.database.addFile(localFilename);
                            this.startNextJob(timestamp);
                        }));
                    }
                );
            });
    }

    private deleteLocalFile(job: SyncJobEntryInterface, timestamp: number) {
        const localPath = this.pathHelper.localPathFromS3Key(job.s3Key);
        fse.remove(localPath, (error) => {
            if (error) {
                throw error;
            }
            this.database.removeFile(localPath);
            this.startNextJob(timestamp);
        });
    }

    private upload(job: SyncJobEntryInterface, timestamp: number) {
        fs.createReadStream(this.pathHelper.localPathFromS3Key(job.s3Key)).pipe(
            this.authenticatedRequest.post(
                ROUTES.files.uploadObjects,
                {
                    qs: {
                        key: job.s3Key
                    }
                },
                (error, response, body) => {
                    if (error) {
                        log.error('Error uploading file', error);
                        throw error;
                    }
                    if (response.statusCode === 200) {
                        try {
                            if (JSON.parse(body).hasOwnProperty('eTag')) {
                                this.database.addFile(this.pathHelper.localPathFromS3Key(job.s3Key), true);
                            } else {
                                log.error('Could not upload file', job.s3Key, body);
                                ipcRenderer.sendTo(
                                    this.userInterfaceWebContentsId,
                                    EVENTS.notification,
                                    NotificationType.ERROR,
                                    'Could not upload ' + job.s3Key
                                );
                            }
                        } catch (e) {
                            log.error('Could not upload file', job.s3Key, e);
                            ipcRenderer.sendTo(
                                this.userInterfaceWebContentsId,
                                EVENTS.notification,
                                NotificationType.ERROR,
                                'Could not upload ' + job.s3Key
                            );
                        }
                    } else {
                        log.error('Could not upload file', job.s3Key, response);
                        ipcRenderer.sendTo(
                            this.userInterfaceWebContentsId,
                            EVENTS.notification,
                            NotificationType.ERROR,
                            'Could not upload ' + job.s3Key
                        );
                    }
                    this.startNextJob(timestamp);
                }
            )
        );
    }

    private installPlugin(plugin: PluginIdentifierInterface) {
        this.jobQueue = [];
        this.watcher.stop();
        this.getFileList(path.join(
            this.options.syncPath,
            plugin.pluginSetId,
            plugin.pluginName
        )).forEach((filePath: string) => {
            if (!this.ignoreChecker.isIgnored(this.pathHelper.s3KeyFromLocalPath(filePath))) {
                this.jobQueue.push({
                    s3Key: this.pathHelper.s3KeyFromLocalPath(filePath),
                    syncType: SyncType.UPLOAD
                });
            }
        });
        ipcRenderer.sendTo(this.userInterfaceWebContentsId, EVENTS.queue.start, this.jobQueue.length);
        this.startNextJob(plugin.timestamp);
    }

    private checkNotFinishedJobs() {
        const notFinishedJob = this.lockfile.read();
        if (notFinishedJob) {
            log.warn('notFinishedJob', notFinishedJob);
            switch (notFinishedJob.syncType) {
                case SyncType.DOWNLOAD_SINGLE_FILE: {
                    const fileToRemove = this.pathHelper.localPathFromS3Key(notFinishedJob.s3Key);
                    fse.removeSync(fileToRemove);
                    log.debug('file removed', fileToRemove);
                    break;
                }
                case SyncType.DOWNLOAD_PLUGIN_ZIP: {
                    const dirToRemove = this.pathHelper.pluginDirectoryFromS3Key(notFinishedJob.s3Key);
                    fse.removeSync(dirToRemove);
                    log.debug('directory removed', dirToRemove);
                    break;
                }
                case SyncType.UPLOAD: {
                    // nothing to do. S3 only stores completed uploads.
                    break;
                }
                default: {
                    throw new Error('Unknown job');
                }
            }
            this.lockfile.remove();
        }
    }
}
