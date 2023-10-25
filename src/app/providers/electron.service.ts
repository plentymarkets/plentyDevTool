import { Injectable } from '@angular/core';
// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import { EVENTS } from '../../constants';

@Injectable({
    providedIn: 'root'
    })
export class ElectronService {
    private syncWorkerWebContentsId: number;

    public ipcRenderer: typeof ipcRenderer;
    public webFrame: typeof webFrame;
    public remote: typeof remote;
    public childProcess: typeof childProcess;
    public fs: typeof fs;
    public path: typeof path;
    public fse: typeof fse;

    constructor() {
        // Conditional imports
        if (this.isElectron()) {
            this.ipcRenderer = window.require('electron').ipcRenderer;
            this.webFrame = window.require('electron').webFrame;
            this.remote = window.require('@electron/remote');

            this.childProcess = window.require('child_process');
            this.fs = window.require('fs');
            this.path = window.require('path');
            this.fse = window.require('fs-extra');
        }
    }

    public isElectron() {
        return window && window.process && window.process.type;
    }

    public sendToMain(channel: string, payload?: any) {
        this.ipcRenderer.send(channel, payload);
    }

    public sendToSyncWorker(channel: string, payload?: any) {
        if (!this.syncWorkerWebContentsId) {
            this.syncWorkerWebContentsId = this.ipcRenderer.sendSync(EVENTS.getSyncWorkerWebContentsId);
        }
        if (payload) {
            this.sendToMain(EVENTS.watcher.newTimestamp, payload.timestamp);
        }

        this.ipcRenderer.sendTo(this.syncWorkerWebContentsId, channel, payload);
    }
}
