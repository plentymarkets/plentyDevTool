export class Fse {
    public ensureDirSync() {
    }
}

export class MockIpcRenderer {
    public on(...objects: any[]) {
        return true;
    }

    public send() {
    }
}

export class MockElectronService {
    public ipcRenderer;
    public webFrame;
    public remote;
    public fs;
    public path;
    public fse;

    constructor() {
        this.ipcRenderer = new MockIpcRenderer();
        this.path = ['bar'];
        this.fse = new Fse();
    }

    public log(...objects: any[]) {
    }
}

